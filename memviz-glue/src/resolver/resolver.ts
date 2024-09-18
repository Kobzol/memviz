import type { Address, Place } from "process-def";

export interface ProcessResolver {
  getPlaces(frameIndex: number): Promise<Place[]>;
  readMemory(address: Address, size: bigint): Promise<ArrayBuffer>;
}
