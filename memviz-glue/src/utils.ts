import type { Address, AddressStr } from "process-def";

export async function measureAsync<T>(
  name: string,
  block: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  const result = await block();
  const duration = performance.now() - start;
  console.log(`[TIMER] ${name}: ${duration.toFixed(2)}ms`);
  return result;
}

export function addressToStr(address: Address): AddressStr {
  return `0x${address.toString(16)}`;
}

export function strToAddress(address: AddressStr): Address {
  return BigInt(address);
}

export function bufferToByteArray(buffer: ArrayBuffer): number[] {
  return [...new Uint8Array(buffer)];
}

export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}
