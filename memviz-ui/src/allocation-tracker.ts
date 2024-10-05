import type { Address } from "process-def";
import BTree from "sorted-btree";
import { assert } from "./utils";

export interface HeapAllocation {
  address: Address;
  size: number;
}

// Tracks dynamic memory allocations on the heap
export class AllocationTracker {
  private allocations: BTree<Address, HeapAllocation> = new BTree();

  getAllocations(): HeapAllocation[] {
    return this.allocations.valuesArray();
  }

  getAllocationContaining(address: Address): HeapAllocation | null {
    const entry = this.allocations.getPairOrNextLower(address);
    if (entry === undefined) return null;
    const allocation = entry[1];

    const end = allocation.address + BigInt(allocation.size);
    if (end <= address) return null;
    assert(
      allocation.address <= address && address < end,
      "allocation was not in the expected location",
    );
    return allocation;
  }

  allocateMemory(address: bigint, size: number) {
    this.allocations.set(address, {
      address,
      size,
    } satisfies HeapAllocation);
  }
  freeMemory(address: bigint) {
    assert(
      this.allocations.delete(address),
      `allocation at ${address} not found`,
    );
  }
}
