import type { Place } from "process-def";

export interface ProcessResolver {
  getPlaces(frameIndex: number): Promise<Place[]>;
  readMemory(address: string, size: number): Promise<ArrayBuffer>;
}
