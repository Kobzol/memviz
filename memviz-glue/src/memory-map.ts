import type { Address } from "process-def";
import BTree from "sorted-btree";
import { assert, addressToStr, bufferToByteArray } from "./utils";

export class MemoryMap {
  private map: BTree<Address, ArrayBuffer> = new BTree();

  set(address: Address, buffer: ArrayBuffer) {
    let record = this.map.getPairOrNextLower(address);
    if (record === undefined || getLastAddress(getSpan(record)) < address) {
      record = this.map.getPairOrNextHigher(address);
    }

    let current = address;
    const end = current + BigInt(buffer.byteLength);
    while (current < end) {
      if (record === undefined || record[0] >= end) {
        break;
      }
      const recordSpan = getSpan(record);
      const overlap = getOverlap(recordSpan, {
        address: current,
        size: end - current,
      });
      assert(overlap !== null, "overlap has to be found");

      // We fully consume this record, remove it
      if (
        overlap.address === recordSpan.address &&
        overlap.size === recordSpan.size
      ) {
        this.map.delete(recordSpan.address);
        record = this.map.nextHigherPair(recordSpan.address);
        continue;
      }

      // Handle the part before the overlap
      if (overlap.address > current) {
        const start = Number(current - address);
        const count = overlap.address - current;
        this.map.set(current, buffer.slice(start, start + Number(count)));
        current += count;
      }

      // Overwrite the existing record
      copyBuffer(
        buffer,
        current - address,
        overlap.size,
        record[1],
        overlap.address - record[0],
      );
      record = this.map.nextHigherPair(record[0]);
      current += overlap.size;
    }

    if (current < end) {
      this.map.set(current, buffer.slice(Number(current - address)));
    }
    this.defragment(address, end);
  }

  // If fillMissingWithZero is true, missing bytes are filled with zero.
  // Otherwise, returns null if missing bytes are encountered.
  read(
    address: Address,
    count: bigint,
    fillMissingWithZero = false,
  ): ArrayBuffer | null {
    const buffer = new ArrayBuffer(Number(count));
    const array = new Uint8Array(buffer);
    let record = this.map.getPairOrNextLower(address);
    const end = address + count;

    if (record === undefined || getLastAddress(getSpan(record)) < address) {
      record = this.map.getPairOrNextHigher(address);
    }

    let current = address;
    while (current < end) {
      // No more records
      if (record === undefined || record[0] >= end) {
        break;
      }
      const overlap = getOverlap(getSpan(record), {
        address: current,
        size: end - current,
      });
      assert(overlap !== null, "overlap has to be found");

      // Do not allow gaps
      if (!fillMissingWithZero && overlap.address !== current) {
        break;
      }
      const srcArray = new Uint8Array(
        record[1],
        Number(overlap.address - record[0]),
        Number(overlap.size),
      );
      array.set(srcArray, Number(overlap.address - address));
      current = getLastAddress(overlap) + BigInt(1);
      record = this.map.nextHigherPair(record[0]);
    }

    // Some bytes were missing
    if (current < end && !fillMissingWithZero) {
      return null;
    }
    return buffer;
  }

  readZeroFilled(address: Address, count: bigint): ArrayBuffer | null {
    return this.read(address, count, true);
  }

  segmentCount(): number {
    return this.map.length;
  }

  dump() {
    this.map.forEachPair((address, buffer) => {
      console.log(addressToStr(address), bufferToByteArray(buffer));
    });
  }

  private defragment(start: Address, end: Address) {
    // Find the earliest consecutive segment
    let record = this.map.getPairOrNextLower(start);
    while (record !== undefined) {
      const prev = this.map.nextLowerPair(record[0]);
      if (prev !== undefined && getOnePastEnd(getSpan(prev)) === record[0]) {
        record = prev;
      } else {
        break;
      }
    }
    let toMerge: [Address, ArrayBuffer][] = [];

    const tryMerge = () => {
      if (toMerge.length > 1) {
        const count = toMerge.reduce(
          (sum, record) => sum + BigInt(record[1].byteLength),
          BigInt(0),
        );

        // Create a merged buffer
        const array = new Uint8Array(Number(count));
        let offset = 0;
        for (const record of toMerge) {
          array.set(new Uint8Array(record[1]), offset);
          offset += record[1].byteLength;
        }

        // Delete all the old buffers
        for (const record of toMerge) {
          assert(this.map.delete(record[0]), "record was not found");
        }

        // Insert the merged buffer
        this.map.set(toMerge[0][0], array.buffer);
      }
    };

    while (record !== undefined && record[0] <= end) {
      if (toMerge.length === 0) {
        toMerge.push(record);
      } else {
        const last = toMerge[toMerge.length - 1];
        // Consecutive buffer, add to merge run
        if (getOnePastEnd(getSpan(last)) === record[0]) {
          toMerge.push(record);
        } else {
          tryMerge();
          toMerge = [record];
        }
      }
      record = this.map.nextHigherPair(record[0]);
    }
    tryMerge();
  }
}

interface Span {
  address: Address;
  size: bigint;
}

function getOverlap(a: Span, b: Span): Span | null {
  const lastA = getLastAddress(a);
  const lastB = getLastAddress(b);

  if (lastA < b.address) return null;
  if (a.address > lastB) return null;
  const start = a.address > b.address ? a.address : b.address;
  const end = lastA < lastB ? lastA : lastB;
  return {
    address: start,
    size: end - start + BigInt(1),
  };
}

function getOnePastEnd(span: Span): Address {
  return span.address + span.size;
}

function getLastAddress(span: Span): Address {
  return getOnePastEnd(span) - BigInt(1);
}

function getSpan([address, buffer]: [Address, ArrayBuffer]): Span {
  return {
    address,
    size: BigInt(buffer.byteLength),
  };
}

function copyBuffer(
  source: ArrayBuffer,
  srcOffset: bigint,
  count: bigint,
  dest: ArrayBuffer,
  destOffset: bigint,
) {
  const destArray = new Uint8Array(dest, Number(destOffset));
  const srcArray = new Uint8Array(source, Number(srcOffset), Number(count));
  destArray.set(srcArray);
}
