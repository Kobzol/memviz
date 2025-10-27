import type { AddressStr, FrameIndex } from "process-def";
import type { Variables as DebugpyVariables } from "process-def/debugpy";
import type { Place as GDBPlace } from "process-def/gdb";
import type { MemoryAllocEvent } from "../messages";

export interface ProcessResolver {
  getPlaces(frameIndex: FrameIndex): Promise<GDBPlace[]>;
  readMemory(address: AddressStr, size: number): Promise<ArrayBuffer>;
  takeAllocEvents(): Promise<MemoryAllocEvent[]>;
  createVariablesRepresentation(
    frameIndex: FrameIndex,
  ): Promise<DebugpyVariables>;
}
