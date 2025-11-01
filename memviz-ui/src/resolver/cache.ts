import type { AddressStr, FrameIndex } from "process-def";
import type {
  KeyValuePair,
  Value as PythonValue,
  Variables as PythonVariables,
} from "process-def/debugpy";
import type { Place } from "process-def/gdb";
import { MemoryMap } from "../memory-map";
import type { MemoryAllocEvent } from "../messages";
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

  async createVariablesRepresentation(
    frameIndex: FrameIndex,
  ): Promise<PythonVariables> {
    return await this.inner.createVariablesRepresentation(frameIndex);
  }

  async getCollectionTypeElements(
    id: AddressStr,
    frameIndex: number,
    elementCount: number,
    startIndex: number,
  ): Promise<PythonValue[]> {
    return await this.inner.getCollectionTypeElements(
      id,
      frameIndex,
      elementCount,
      startIndex,
    );
  }

  async getStringContents(
    id: AddressStr,
    frameIndex: number,
    startIndex: number,
    length: number,
  ): Promise<string> {
    return await this.inner.getStringContents(
      id,
      frameIndex,
      startIndex,
      length,
    );
  }

  async getDictEntries(
    id: AddressStr,
    frameIndex: number,
    startIndex: number,
    pairCount: number,
  ): Promise<KeyValuePair[]> {
    return await this.inner.getDictEntries(
      id,
      frameIndex,
      startIndex,
      pairCount,
    );
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

  async takeAllocEvents(): Promise<MemoryAllocEvent[]> {
    return await this.inner.takeAllocEvents();
  }
}
