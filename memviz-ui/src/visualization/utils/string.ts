import type { Address } from "process-def";
import type { ProcessResolver } from "../../resolver/resolver";
import { addressToStr } from "../../utils";

// Load a C string from the specified address. Tries to load until it encounters a zero.
export async function loadCString(
  resolver: ProcessResolver,
  address: Address,
): Promise<ArrayBuffer> {
  let buffer: ArrayBuffer | null = null;
  const segmentSize = 100;

  while (true) {
    const segment = await resolver.readMemory(
      addressToStr(address),
      segmentSize,
    );
    const originalLength = buffer?.byteLength ?? 0;
    const zeroByteIndex = findZero(segment);
    if (buffer === null) {
      buffer = segment;
    } else {
      buffer = mergeBuffers(buffer, segment);
    }
    if (zeroByteIndex !== null) {
      buffer = buffer.slice(0, originalLength + zeroByteIndex);
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
