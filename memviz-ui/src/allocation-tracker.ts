import type { Address } from "process-def";
import BTree from "sorted-btree";
import { assert } from "./utils";

export interface HeapAllocation {
  address: Address;
  size: number;
  // Is the allocation active or has it been already freed?
  active: boolean;
}

// Tracks dynamic memory allocations on the heap
export class AllocationTracker {
  private allocations: BTree<Address, HeapAllocation> = new BTree();
  // Inactive allocations that should be remove on the next "memory allocated" event.
  private pending: Address[] = [];

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
    // TODO: make this more precise and only remove allocations that are actually overwritten
    for (const pendingAddress of this.pending) {
      this.allocations.delete(pendingAddress);
    }
    this.pending = [];

    this.allocations.set(address, {
      address,
      size,
      active: true,
    } satisfies HeapAllocation);
  }
  freeMemory(address: bigint) {
    const entry = this.allocations.get(address);
    if (entry === undefined) {
      console.error(`Allocation at ${address} not found`);
      return;
    }
    // We have to avoid an in-place edit for props immutable checking to work
    this.allocations.set(
      address,
      {
        ...entry,
        active: false,
      },
      true,
    );
    this.pending.push(address);
  }
}
