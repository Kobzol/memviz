import { type KeyValuePair, ValueKind } from "process-def/debugpy";
import type { DebugpyResolver } from "../../../resolver/adapters/debugpy";
import { assert } from "../../../utils";
import { type RichAttribute, type RichKeyValuePair, RichValue } from "./type";

type ItemIndex = number;

abstract class LazyCollectionVal<TValue> extends RichValue {
  private pendingRequests: Map<ItemIndex, Promise<Map<ItemIndex, TValue>>> =
    new Map();

  protected abstract makeRequest(
    resolver: DebugpyResolver,
    indices: ItemIndex[],
  ): Promise<Map<ItemIndex, TValue>>;

  protected abstract getItemCount(): number;
  protected abstract hasItem(index: ItemIndex): boolean;
  protected abstract setItem(index: ItemIndex, value: TValue): void;
  protected abstract getFetchedElements(
    index: ItemIndex,
    count: number,
  ): TValue[];

  private async fetchElements(resolver: DebugpyResolver, indices: ItemIndex[]) {
    try {
      const fetchPromise = this.makeRequest(resolver, indices);
      for (const i of indices) {
        this.pendingRequests.set(i, fetchPromise);
      }
      const valueMap = await fetchPromise;

      for (const [idx, value] of valueMap.entries()) {
        if (!this.hasItem(idx)) {
          this.setItem(idx, value);
        }
      }
    } finally {
      for (const i of indices) {
        this.pendingRequests.delete(i);
      }
    }
  }

  public async getElements(
    resolver: DebugpyResolver,
    startIdx: ItemIndex,
    count: number,
  ): Promise<TValue[]> {
    const itemCount = this.getItemCount();
    const endIdx = Math.min(itemCount, startIdx + count);

    assert(
      startIdx >= 0 && endIdx <= itemCount,
      `Requested indices are out of bounds for element_count ${itemCount}: [${startIdx}, ${endIdx})`,
    );

    const extraFetchSize = 10;
    const threshold = 5;

    let isBufferBelowAvailable = true;
    let isBufferAboveAvailable = true;
    let areAllElementsAvailable = true;

    const promisesToAwait: Promise<any>[] = [];
    const indicesToFetch: ItemIndex[] = [];

    // check buffer below
    for (let i = Math.max(0, startIdx - threshold); i < startIdx; i++) {
      const pendingPromise = this.pendingRequests.get(i);
      if (!this.hasItem(i) && !pendingPromise) {
        indicesToFetch.push(i);
        isBufferBelowAvailable = false;
      }
    }

    if (!isBufferBelowAvailable) {
      // expand fetch to include full buffer below
      for (
        let i = Math.max(0, startIdx - extraFetchSize);
        i < Math.max(0, startIdx - threshold);
        i++
      ) {
        const pendingPromise = this.pendingRequests.get(i);
        if (!this.hasItem(i) && !pendingPromise) {
          indicesToFetch.push(i);
        }
      }
    }

    // check buffer above
    for (
      let i = endIdx;
      i < Math.min(this.getItemCount(), endIdx + threshold);
      i++
    ) {
      const pendingPromise = this.pendingRequests.get(i);
      if (!this.hasItem(i) && !pendingPromise) {
        indicesToFetch.push(i);
        isBufferAboveAvailable = false;
      }
    }

    if (!isBufferAboveAvailable) {
      // expand fetch to include full buffer above
      for (
        let i = Math.min(this.getItemCount(), endIdx + threshold);
        i < Math.min(this.getItemCount(), endIdx + extraFetchSize);
        i++
      ) {
        const pendingPromise = this.pendingRequests.get(i);
        if (!this.hasItem(i) && !pendingPromise) {
          indicesToFetch.push(i);
        }
      }
    }

    // check requested range
    for (let i = startIdx; i < endIdx; i++) {
      const pendingPromise = this.pendingRequests.get(i);
      if (!this.hasItem(i)) {
        if (pendingPromise) {
          promisesToAwait.push(pendingPromise.then(() => {}));
        } else {
          indicesToFetch.push(i);
          areAllElementsAvailable = false;
        }
      }
    }
    const currentPromise = this.fetchElements(resolver, indicesToFetch);
    if (!areAllElementsAvailable) {
      promisesToAwait.push(currentPromise);
    }
    await Promise.all(promisesToAwait);

    return this.getFetchedElements(startIdx, endIdx - startIdx);
  }
}

export class LazyStrVal extends LazyCollectionVal<string> {
  readonly kind = ValueKind.STR;

  constructor(
    id: string,
    public readonly size: number,
    public readonly length: number,
    private readonly content: { [key: number]: string },
  ) {
    super(id);
  }

  protected async makeRequest(
    resolver: DebugpyResolver,
    indices: ItemIndex[],
  ): Promise<Map<ItemIndex, string>> {
    const res = await resolver.getStringContents(this.id, indices);
    return new Map(indices.map((idx, i) => [idx, res[i]]));
  }
  protected getItemCount(): number {
    return this.length;
  }
  protected hasItem(index: ItemIndex): boolean {
    return index in this.content;
  }
  protected setItem(index: ItemIndex, value: string): void {
    this.content[index] = value;
  }
  protected getFetchedElements(index: ItemIndex, count: number): string[] {
    const result: string[] = [];
    for (let i = index; i < index + count; i++) {
      result.push(this.content[i]);
    }
    return result;
  }
}

export abstract class LazyFlatCollectionVal extends LazyCollectionVal<RichValue> {
  constructor(
    id: string,
    public readonly element_count: number,
    private readonly elements: { [key: number]: RichValue },
  ) {
    super(id);
  }

  protected async makeRequest(
    resolver: DebugpyResolver,
    indices: ItemIndex[],
  ): Promise<Map<ItemIndex, RichValue>> {
    const res = await resolver.getCollectionElements(this.id, indices);
    return new Map(indices.map((idx, i) => [idx, res[i]]));
  }

  protected getItemCount(): number {
    return this.element_count;
  }
  protected hasItem(index: ItemIndex): boolean {
    return index in this.elements;
  }
  protected setItem(index: ItemIndex, value: RichValue): void {
    this.elements[index] = value;
  }
  protected getFetchedElements(index: ItemIndex, count: number): RichValue[] {
    const result: RichValue[] = [];
    for (let i = index; i < index + count; i++) {
      result.push(this.elements[i]);
    }
    return result;
  }
}

export class LazyListVal extends LazyFlatCollectionVal {
  readonly kind = ValueKind.LIST;
}

export class LazyTupleVal extends LazyFlatCollectionVal {
  readonly kind = ValueKind.TUPLE;
}

export class LazySetVal extends LazyFlatCollectionVal {
  readonly kind = ValueKind.SET;
}

export class LazyFrozenSetVal extends LazyFlatCollectionVal {
  readonly kind = ValueKind.FROZENSET;
}

export class LazyDictVal extends LazyCollectionVal<RichKeyValuePair> {
  readonly kind = ValueKind.DICT;

  constructor(
    id: string,
    public readonly pair_count: number,
    private readonly pairs: { [key: number]: RichKeyValuePair },
  ) {
    super(id);
  }

  protected async makeRequest(
    resolver: DebugpyResolver,
    indices: ItemIndex[],
  ): Promise<Map<ItemIndex, KeyValuePair>> {
    const res = await resolver.getDictEntries(this.id, indices);
    return new Map(indices.map((idx, i) => [idx, res[i]]));
  }
  protected getItemCount(): number {
    return this.pair_count;
  }
  protected hasItem(index: ItemIndex): boolean {
    return index in this.pairs;
  }
  protected setItem(index: ItemIndex, value: KeyValuePair): void {
    this.pairs[index] = value;
  }
  protected getFetchedElements(
    index: ItemIndex,
    count: number,
  ): RichKeyValuePair[] {
    const result: RichKeyValuePair[] = [];
    for (let i = index; i < index + count; i++) {
      result.push(this.pairs[i]);
    }
    return result;
  }
}

export class LazyObjectVal extends RichValue {
  readonly kind = ValueKind.OBJECT;

  constructor(
    id: string,
    public readonly size: number,
    public readonly type_name: string,
    private attributes: RichAttribute[] | null = null,
  ) {
    super(id);
  }

  private async fetchAttributes(resolver: DebugpyResolver) {
    try {
      this.attributes = await resolver.getObject(this.id);
    } catch (e) {
      this.attributes = [];
      console.error(
        `Failed to fetch attributes for object ${this.id} (type: ${this.type_name}):`,
        e,
      );
    }
  }

  public async getAttributes(
    resolver: DebugpyResolver,
  ): Promise<RichAttribute[]> {
    if (this.attributes === null) {
      await this.fetchAttributes(resolver);
    }
    return this.attributes!;
  }
}
