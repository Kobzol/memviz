import type { AddressStr, FrameIndex } from "process-def";
import type { Place as GDBPlace } from "process-def/gdb";
import type { MemoryAllocEvent } from "../../messages";
import type { ProcessResolverCore } from "../core";

export class GDBResolver {
  constructor(protected resolver: ProcessResolverCore) {}
  getPlaces(frameIndex: FrameIndex): Promise<GDBPlace[]> {
    return this.resolver.getPlaces(frameIndex);
  }
  readMemory(address: AddressStr, size: number): Promise<ArrayBuffer> {
    return this.resolver.readMemory(address, size);
  }
  takeAllocEvents(): Promise<MemoryAllocEvent[]> {
    return this.resolver.takeAllocEvents();
  }
}
