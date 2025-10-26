import type { AddressStr, FrameIndex } from "process-def";
import type { Place as GDBPlace } from "process-def/gdb";
import type { MemoryAllocEvent } from "../messages";

export interface ProcessResolver {
  getPlaces(frameIndex: FrameIndex): Promise<GDBPlace[]>;
  readMemory(address: AddressStr, size: number): Promise<ArrayBuffer>;
  takeAllocEvents(): Promise<MemoryAllocEvent[]>;
}
