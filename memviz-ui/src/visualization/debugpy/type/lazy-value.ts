import { type PythonId, ValueKind } from "process-def/debugpy";
import type { DebugpyResolver } from "../../../resolver/adapters/debugpy";
import { assert } from "../../../utils";
import {
  CACHE_CAPACITY_BLOCKS,
  COLLECTION_BLOCK_SIZE,
  COLLECTION_PREFETCH_BLOCK_COUNT,
} from "../value-display-settings";
import {
  type RichAttribute,
  type RichKeyValuePair,
  type RichValue,
  SizedDescribedRichValue,
} from "./type";

type ItemIndex = number;
type BlockIndex = number;

class Cache<TValue> {
  private map: Map<number, TValue> = new Map();

  constructor(private readonly capacity: number) {}

  public get(key: number): TValue | undefined {
    const val = this.map.get(key);
    if (val !== undefined) {
      // refresh insertion order to match recent access
      this.map.delete(key);
      this.map.set(key, val);
    }
    return val;
  }

  public set(key: number, value: TValue): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // if at capacity, remove oldest entry
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
    this.map.set(key, value);
  }

  public clear(): void {
    this.map.clear();
  }

  public values(): IterableIterator<TValue> {
    return this.map.values();
  }
}

abstract class LazyCollectionVal<TValue> extends SizedDescribedRichValue {
  private pendingRequests: Map<BlockIndex, Promise<TValue>> = new Map();
  private blocks: Cache<TValue> = new Cache<TValue>(CACHE_CAPACITY_BLOCKS);

  public setValues(values: TValue): void {
    this.blocks.clear();
    this.pendingRequests.clear();
    this.assignValuesToBlocks(values, 0);
  }

  protected getFetchedBlockValues(): TValue[] {
    return Array.from(this.blocks.values());
  }

  protected getBlockIndex(itemIndex: ItemIndex): BlockIndex {
    return Math.floor(itemIndex / COLLECTION_BLOCK_SIZE);
  }

  protected getStartItemIndexForBlock(blockIndex: BlockIndex): ItemIndex {
    return blockIndex * COLLECTION_BLOCK_SIZE;
  }

  protected getEndItemIndexForBlock(blockIndex: BlockIndex): ItemIndex {
    return Math.min(
      this.getItemCount(),
      (blockIndex + 1) * COLLECTION_BLOCK_SIZE,
    );
  }

  protected abstract makeRequest(
    resolver: DebugpyResolver,
    start: ItemIndex,
    count: number,
  ): Promise<TValue>;

  protected abstract getItemCount(): number;

  protected abstract slice(data: TValue, start: number, end: number): TValue;
  protected abstract joinParts(parts: TValue[]): TValue;
  protected abstract getLength(data: TValue): number;
  protected abstract getEmptyValue(): TValue;

  public areItemsFetched(start: ItemIndex, count: number): boolean {
    if (count <= 0) return true;
    const startBlockIdx = this.getBlockIndex(start);
    const endBlockIdx = this.getBlockIndex(start + count - 1);

    for (let blockIdx = startBlockIdx; blockIdx <= endBlockIdx; blockIdx++) {
      if (!this.blocks.get(blockIdx)) {
        return false;
      }
    }
    return true;
  }

  protected assignValuesToBlocks(values: TValue, startIdx: ItemIndex) {
    const startBlockIdx = this.getBlockIndex(startIdx);
    const endItemIdx = startIdx + this.getLength(values) - 1;
    const endBlockIdx = this.getBlockIndex(endItemIdx);

    for (let blockIdx = startBlockIdx; blockIdx <= endBlockIdx; blockIdx++) {
      const blockStartItemIdx = this.getStartItemIndexForBlock(blockIdx);
      const blockEndItemIdx = Math.min(
        this.getEndItemIndexForBlock(blockIdx),
        this.getItemCount() - 1,
      );

      // do not assign values into incomplete blocks
      if (blockStartItemIdx < startIdx) continue;
      if (blockEndItemIdx > endItemIdx) continue;

      this.blocks.set(
        blockIdx,
        this.slice(
          values,
          blockStartItemIdx - startIdx,
          blockEndItemIdx - startIdx + 1,
        ),
      );
    }
  }
  private async fetchItems(
    resolver: DebugpyResolver,
    startIdx: ItemIndex,
    count: number,
  ) {
    const startBlockIdx = this.getBlockIndex(startIdx);
    const endBlockIdx = this.getBlockIndex(startIdx + count - 1);

    const fetchPromise = this.makeRequest(resolver, startIdx, count);

    try {
      // mark all involved blocks as pending
      for (let blockIdx = startBlockIdx; blockIdx <= endBlockIdx; blockIdx++) {
        this.pendingRequests.set(blockIdx, fetchPromise);
      }

      const valueMap = await fetchPromise;

      this.assignValuesToBlocks(valueMap, startIdx);
    } catch (e) {
      console.error(
        `Failed to fetch items for ${this.id}, start=${startIdx}, count=${count}:`,
        e,
      );
      throw e;
    } finally {
      // clear pending marks
      for (let blockIdx = startBlockIdx; blockIdx <= endBlockIdx; blockIdx++) {
        this.pendingRequests.delete(blockIdx);
      }
    }
  }

  private getFetchedItems(start: ItemIndex, count: number): TValue {
    const emptyValue = this.getEmptyValue();
    const end = start + count;

    const startBlockIdx = this.getBlockIndex(start);
    const endBlockIdx = this.getBlockIndex(end - 1);

    const resultParts: TValue[] = [];
    for (let blockIdx = startBlockIdx; blockIdx <= endBlockIdx; blockIdx++) {
      const block = this.blocks.get(blockIdx);

      const pageStartGlobal = blockIdx * COLLECTION_BLOCK_SIZE;

      const sliceStart = Math.max(0, start - pageStartGlobal);
      const sliceEnd = Math.min(COLLECTION_BLOCK_SIZE, end - pageStartGlobal);

      if (!block) {
        console.error(
          `Block ${blockIdx} is not fetched yet for LazyCollectionVal ${this.id}`,
        );
        return emptyValue;
      }

      const chunk = this.slice(block, sliceStart, sliceEnd);
      resultParts.push(chunk);
    }
    return this.joinParts(resultParts);
  }

  private isBlockLoadedOrPending(blockIdx: BlockIndex): boolean {
    return (
      this.blocks.get(blockIdx) !== undefined ||
      this.pendingRequests.get(blockIdx) !== undefined
    );
  }
  public async getElements(
    resolver: DebugpyResolver,
    startIdx: ItemIndex,
    count: number,
  ): Promise<TValue> {
    const itemCount = this.getItemCount();
    const safeStartIdx = Math.max(0, startIdx);
    const safeEndIdx = Math.min(itemCount, startIdx + count) - 1;
    const safeCount = safeEndIdx - safeStartIdx + 1;

    if (safeCount <= 0) return this.getEmptyValue();

    const criticalStartBlockIdx = this.getBlockIndex(safeStartIdx);
    const criticalEndBlockIdx = this.getBlockIndex(safeEndIdx);

    const maxBlockIndex = this.getBlockIndex(itemCount - 1);

    const bufferBelowStartBlockIdx = criticalStartBlockIdx - 1;
    const bufferAboveEndBlockIdx = criticalEndBlockIdx + 1;

    let minFetchBlockIdx = Number.POSITIVE_INFINITY;
    let maxFetchBlockIdx = Number.NEGATIVE_INFINITY;

    function expandFetchRange(blockIdx: BlockIndex) {
      minFetchBlockIdx = Math.min(minFetchBlockIdx, blockIdx);
      maxFetchBlockIdx = Math.max(maxFetchBlockIdx, blockIdx);
    }

    let needsFetch = false;

    // check buffer below
    if (
      bufferBelowStartBlockIdx >= 0 &&
      !this.isBlockLoadedOrPending(bufferBelowStartBlockIdx)
    ) {
      needsFetch = true;
      expandFetchRange(bufferBelowStartBlockIdx);
      // expand extra blocks down
      for (let i = COLLECTION_PREFETCH_BLOCK_COUNT; i >= 0; i--) {
        const blockIdx = criticalStartBlockIdx - i;
        if (blockIdx >= 0 && !this.isBlockLoadedOrPending(blockIdx)) {
          expandFetchRange(blockIdx);
          break;
        }
      }
    }

    // check buffer above
    if (
      bufferAboveEndBlockIdx <= maxBlockIndex &&
      !this.isBlockLoadedOrPending(bufferAboveEndBlockIdx)
    ) {
      needsFetch = true;
      expandFetchRange(bufferAboveEndBlockIdx);
      // expand extra blocks up
      for (let i = COLLECTION_PREFETCH_BLOCK_COUNT; i >= 0; i--) {
        const blockIdx = criticalEndBlockIdx + i;
        if (
          blockIdx <= maxBlockIndex &&
          !this.isBlockLoadedOrPending(blockIdx)
        ) {
          expandFetchRange(blockIdx);
          break;
        }
      }
    }

    // check critical part
    let isCriticalPartFetched = true;
    for (let i = criticalStartBlockIdx; i <= criticalEndBlockIdx; i++) {
      if (this.pendingRequests.get(i) !== undefined) {
        try {
          await this.pendingRequests.get(i);
        } catch (e) {
          console.error(
            `Failed to fetch items for ${this.id} in critical range, block ${i}:`,
            e,
          );
          return this.getEmptyValue();
        }
        continue;
      }
      if (this.blocks.get(i) === undefined) {
        isCriticalPartFetched = false;
        needsFetch = true;
        expandFetchRange(i);
      }
    }

    if (needsFetch && minFetchBlockIdx <= maxFetchBlockIdx) {
      const fetchStartIdx = this.getStartItemIndexForBlock(minFetchBlockIdx);
      const fetchEndIdx = this.getEndItemIndexForBlock(maxFetchBlockIdx);
      const fetchCount = fetchEndIdx - fetchStartIdx;

      const fetchPromise = this.fetchItems(resolver, fetchStartIdx, fetchCount);

      if (!isCriticalPartFetched) {
        try {
          // await if critical part was missing
          await fetchPromise;
        } catch (e) {
          console.error(
            `Failed to fetch items for ${this.id}, start=${fetchStartIdx}, count=${fetchCount}:`,
            e,
          );
          return this.getEmptyValue();
        }
      } else {
        fetchPromise.catch((e) =>
          console.error(
            `Background fetch failed for ${this.id}, start=${fetchStartIdx}, count=${fetchCount}:`,
            e,
          ),
        );
      }
    }

    // return requested items
    const fetchedItems = this.getFetchedItems(safeStartIdx, safeCount);

    assert(
      this.getLength(fetchedItems) === safeCount,
      `Not all requested items were fetched for indices [${safeStartIdx}, ${safeEndIdx})`,
    );
    return fetchedItems;
  }
}

export class LazyStrVal extends LazyCollectionVal<string> {
  readonly kind = ValueKind.STR;

  constructor(
    id: string,
    size: number,
    public readonly length: number,
    content: string | null = null,
    content_offset = 0,
  ) {
    super(id, size);
    if (content !== null) {
      this.assignValuesToBlocks(content, content_offset);
    }
  }

  protected async makeRequest(
    resolver: DebugpyResolver,
    start: ItemIndex,
    count: number,
  ): Promise<string> {
    return await resolver.getStringContents(this.id, start, count);
  }

  protected slice(data: string, start: number, end: number): string {
    return Array.from(data).slice(start, end).join("");
  }

  protected joinParts(parts: string[]): string {
    return parts.join("");
  }

  protected getLength(data: string): number {
    return Array.from(data).length;
  }

  protected getEmptyValue(): string {
    return "";
  }

  protected getItemCount(): number {
    return this.length;
  }
}

export abstract class LazyFlatCollectionVal extends LazyCollectionVal<
  RichValue[]
> {
  constructor(
    id: string,
    public readonly element_count: number,
    size: number,
    elements: RichValue[] | null = null,
    element_offset = 0,
  ) {
    super(id, size);
    if (elements !== null) {
      this.assignValuesToBlocks(elements, element_offset);
    }
  }

  protected async makeRequest(
    resolver: DebugpyResolver,
    start: ItemIndex,
    count: number,
  ): Promise<RichValue[]> {
    return await resolver.getFlatCollectionElements(this.id, start, count);
  }

  protected slice(data: RichValue[], start: number, end: number): RichValue[] {
    return data.slice(start, end);
  }

  protected joinParts(parts: RichValue[][]): RichValue[] {
    return parts.flat();
  }

  protected getLength(data: RichValue[]): number {
    return data.length;
  }

  protected getEmptyValue(): RichValue[] {
    return [];
  }

  protected getItemCount(): number {
    return this.element_count;
  }

  public override getFetchedChildIds(): PythonId[] {
    return this.getFetchedBlockValues()
      .flat()
      .map((element) => element.id);
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

export class LazyDictVal extends LazyCollectionVal<RichKeyValuePair[]> {
  readonly kind = ValueKind.DICT;

  constructor(
    id: string,
    size: number,
    public readonly pair_count: number,
    pairs: RichKeyValuePair[] | null = null,
    pair_offset = 0,
  ) {
    super(id, size);
    if (pairs !== null) {
      this.assignValuesToBlocks(pairs, pair_offset);
    }
  }

  protected async makeRequest(
    resolver: DebugpyResolver,
    start: ItemIndex,
    count: number,
  ): Promise<RichKeyValuePair[]> {
    return await resolver.getDictEntries(this.id, start, count);
  }

  protected slice(
    data: RichKeyValuePair[],
    start: number,
    end: number,
  ): RichKeyValuePair[] {
    return data.slice(start, end);
  }

  protected joinParts(parts: RichKeyValuePair[][]): RichKeyValuePair[] {
    return parts.flat();
  }

  protected getLength(data: RichKeyValuePair[]): number {
    return data.length;
  }

  protected getEmptyValue(): RichKeyValuePair[] {
    return [];
  }

  protected getItemCount(): number {
    return this.pair_count;
  }

  public override getFetchedChildIds(): PythonId[] {
    const childIds: PythonId[] = [];
    for (const pair of this.getFetchedBlockValues().flat()) {
      childIds.push(pair.key.id);
      childIds.push(pair.value.id);
    }
    return childIds;
  }
}

export class LazyObjectVal extends SizedDescribedRichValue {
  readonly kind = ValueKind.OBJECT;

  constructor(
    id: string,
    size: number,
    public readonly type_name: string,
    private attributes: RichAttribute[] | null = null,
  ) {
    super(id, size);
  }

  public isResolved(): boolean {
    return this.attributes !== null;
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

  public getFetchedAttributes(): RichAttribute[] | null {
    return this.attributes;
  }

  public override getFetchedChildIds(): PythonId[] {
    const childIds: PythonId[] = [];
    for (const attribute of this.attributes ?? []) {
      if (attribute.value !== null) {
        childIds.push(attribute.value.id);
      }
    }
    return childIds;
  }
}
