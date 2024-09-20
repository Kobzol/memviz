import type { AddressStr, Place } from "process-def";
import { MemoryMap } from "../memory-map";
import { strToAddress } from "../utils";
import type { ProcessResolver } from "./resolver";

export class CachingResolver<T extends ProcessResolver>
  implements ProcessResolver
{
  private placeMap: Map<number, Place[]> = new Map();
  private map = new MemoryMap();

  constructor(public inner: T) {}

  async getPlaces(frameIndex: number): Promise<Place[]> {
    let cached = this.placeMap.get(frameIndex);

    if (cached === undefined) {
      cached = await this.inner.getPlaces(frameIndex);
      this.placeMap.set(frameIndex, cached);
    }
    return cached;
  }

  async readMemory(address: AddressStr, size: number): Promise<ArrayBuffer> {
    const memory = this.map.read(strToAddress(address), BigInt(size));
    if (memory !== null) {
      return memory;
    }
    const result = await this.inner.readMemory(address, size);
    this.map.set(strToAddress(address), result);
    return result;
  }
}
