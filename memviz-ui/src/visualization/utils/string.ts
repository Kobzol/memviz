import type { Address } from "process-def";
import type { ProcessResolver } from "../../resolver/resolver";
import { addressToStr } from "../../utils";

// Load a C string from the specified address. Tries to load until it encounters a zero.
export async function loadCString(
  resolver: ProcessResolver,
  address: Address,
  limit = 1000,
): Promise<ArrayBuffer> {
  let buffer: ArrayBuffer = new ArrayBuffer(0);
  const segmentSize = 100;

  while (buffer.byteLength < limit) {
    let segment = await resolver.readMemory(addressToStr(address), segmentSize);
    // Some error ocurred while loading the data
    if (segment.byteLength === 0) {
      break;
    }
    address += BigInt(segment.byteLength);

    const zeroByteIndex = findZero(segment);
    if (zeroByteIndex !== null) {
      segment = segment.slice(0, zeroByteIndex);
    }

    buffer = mergeBuffers(buffer, segment);
    if (zeroByteIndex !== null) {
      break;
    }
  }
  return buffer;
}

function findZero(buffer: ArrayBuffer): number | null {
  const array = new Uint8Array(buffer);
  const index = array.findIndex((v) => v === 0);
  if (index === -1) {
    return null;
  }
  return index;
}

function mergeBuffers(a: ArrayBuffer, b: ArrayBuffer): ArrayBuffer {
  const result = new ArrayBuffer(a.byteLength + b.byteLength);
  new Uint8Array(result).set(new Uint8Array(a));
  new Uint8Array(result, a.byteLength).set(new Uint8Array(b));
  return result;
}
