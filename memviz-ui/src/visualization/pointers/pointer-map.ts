import type { Address, Type } from "process-def";
import BTree from "sorted-btree";
import { type ShallowRef, triggerRef } from "vue";
import type { AddressRegion } from "./region";

export type PointerUnsubscribeFn = () => void;

interface ActivePointer {
  type: Type;
}

export class PointerMap {
  private activePointers: BTree<Address, ActivePointer> = new BTree();

  addPointer(
    address: Address,
    type: Type,
    ref: ShallowRef<PointerMap>,
  ): PointerUnsubscribeFn {
    console.log(`Tracking pointer at ${address} (${type})`);
    this.activePointers.set(address, { type });
    triggerRef(ref);
    return () => {
      console.log(`Untracking pointer at ${address}`);
      this.activePointers.delete(address);
      triggerRef(ref);
    };
  }

  // TODO: generalize to multiple pointers pointing to the same region
  getPointerForRegion(region: AddressRegion): ActivePointer | null {
    if (region.address === null) return null;

    const entry = this.activePointers.getPairOrNextHigher(region.address);
    if (entry === undefined) return null;

    const end = region.address + BigInt(region.size);
    if (entry[0] >= end) return null;

    return entry[1];
  }
}
