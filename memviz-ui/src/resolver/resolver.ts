import type { AddressStr, FrameIndex } from "process-def";
import type {
  Value as PythonValue,
  Variables as PythonVariables,
} from "process-def/debugpy";
import type { Place as GDBPlace } from "process-def/gdb";
import type { MemoryAllocEvent } from "../messages";

export interface ProcessResolver {
  getPlaces(frameIndex: FrameIndex): Promise<GDBPlace[]>;
  readMemory(address: AddressStr, size: number): Promise<ArrayBuffer>;
  takeAllocEvents(): Promise<MemoryAllocEvent[]>;
  createVariablesRepresentation(
    frameIndex: FrameIndex,
  ): Promise<PythonVariables>;
  getCollectionTypeElements(
    reference: string,
    frameIndex: number,
    startIndex: number,
    elementCount: number,
  ): Promise<PythonValue[]>;
  getStringContents(
    reference: string,
    frameIndex: number,
    startIndex: number,
    length: number,
  ): Promise<string>;
}
