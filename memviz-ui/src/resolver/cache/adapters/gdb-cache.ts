import type { AddressStr } from "process-def";
import type { Place } from "process-def/gdb";
import type { MemoryAllocEvent } from "../../../messages";
import { strToAddress } from "../../../utils";
import { MemoryMap } from "../../../visualization/gdb/memory-map";
import { GDBResolver } from "../../adapters/gdb";

export class CachingGDBResolver extends GDBResolver {
  private placeMap: Map<number, Place[]> = new Map();
  private map = new MemoryMap();

  override async getPlaces(frameIndex: number): Promise<Place[]> {
    let cached = this.placeMap.get(frameIndex);

    if (cached === undefined) {
      cached = await super.getPlaces(frameIndex);
      this.placeMap.set(frameIndex, cached);
    }
    return cached;
  }

  override async readMemory(
    address: AddressStr,
    size: number,
  ): Promise<ArrayBuffer> {
    const memory = this.map.read(strToAddress(address), BigInt(size));
    if (memory !== null) {
      return memory;
    }
    const result = await super.readMemory(address, size);
    this.map.set(strToAddress(address), result);
    return result;
  }

  override async takeAllocEvents(): Promise<MemoryAllocEvent[]> {
    return await super.takeAllocEvents();
  }
}
