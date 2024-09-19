import type { Address } from "process-def";
import BTree from "sorted-btree";
import { bufferToByteArray } from "./utils";

export class MemoryMap {
  private map: BTree<Address, ArrayBuffer> = new BTree();

  set(address: Address, buffer: ArrayBuffer) {
    // Check if the addresses do not overlap
    const endAddress = address + BigInt(buffer.byteLength);
    const existing = this.map.getPairOrNextLower(endAddress);
    if (existing !== undefined) {
      const [existingAddr, existingBuffer] = existing;
      const existingEndAddr = existingAddr + BigInt(existingBuffer.byteLength);
      if (!(existingEndAddr <= address || existingAddr >= endAddress)) {
        throw new Error(
          `Overlapping memory addresses.\nSetting range [${address}, ${endAddress - BigInt(1)}], but data already exists at [${existingAddr}, ${existingEndAddr - BigInt(1)}]`,
        );
      }
    }
    this.map.set(address, buffer);
  }

  read(address: Address, count: bigint): Uint8Array | null {
    const record = this.map.getPairOrNextLower(address);
    if (record === undefined) return null;
    const [baseAddr, buffer] = record;

    const offset = address - baseAddr;
    if (BigInt(buffer.byteLength) - offset < count) return null;
    return new Uint8Array(buffer, Number(offset), Number(count));
  }

  dump() {
    this.map.forEachPair((address, buffer) => {
      console.log(address, bufferToByteArray(buffer));
    });
  }
}
