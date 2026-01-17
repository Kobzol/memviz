import { assert } from "../../utils";
import { RichValue } from "./type";

type ItemIndex = number;

abstract class LazySequenceVal<TValue> extends RichValue {
  private pendingRequests: Map<ItemIndex, Promise<Map<ItemIndex, TValue>>> =
    new Map();

  protected abstract makeRequest(
    indices: ItemIndex[],
  ): Promise<Map<ItemIndex, TValue>>;

  protected abstract getItemCount(): number;
  protected abstract hasItem(index: ItemIndex): boolean;
  protected abstract setItem(index: ItemIndex, value: TValue): void;

  private async fetchElements(indices: ItemIndex[]) {
    try {
      const fetchPromise = this.makeRequest(indices);
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

  public async tryFetchElements(
    startIdx: ItemIndex,
    count: number,
  ): Promise<void> {
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

    const currentPromise = this.fetchElements(indicesToFetch);
    if (!areAllElementsAvailable) {
      promisesToAwait.push(currentPromise);
    }
    await Promise.all(promisesToAwait);
  }
}

export class LazyStrVal extends LazySequenceVal<string> {
  kind = "str" as const; // TODO: add kind str from Value ?

  constructor(
    id: string,
    public size: number,
    public length: number,
    public content: { [key: number]: string },
  ) {
    super(id);
  }

  protected async makeRequest(
    indices: ItemIndex[],
  ): Promise<Map<ItemIndex, string>> {
    throw new Error("Method not implemented.");
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
}
