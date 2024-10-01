import type { Address } from "process-def";
import BTree from "sorted-btree";
import { assert } from "./utils";

interface Allocation {
  address: Address;
  size: number;
}

export class AllocationTracker {
  private allocations: BTree<Address, Allocation> = new BTree();

  allocateMemory(address: bigint, size: number) {
    this.allocations.set(address, {
      address,
      size,
    } satisfies Allocation);
  }
  freeMemory(address: bigint) {
    assert(
      this.allocations.delete(address),
      `allocation at ${address} not found`,
    );
  }
}
