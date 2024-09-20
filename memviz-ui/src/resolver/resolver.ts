import type { AddressStr, Place } from "process-def";

export interface ProcessResolver {
  getPlaces(frameIndex: number): Promise<Place[]>;
  readMemory(address: AddressStr, size: number): Promise<ArrayBuffer>;
}
