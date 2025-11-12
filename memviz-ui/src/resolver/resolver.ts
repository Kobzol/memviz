import type { AddressStr, FrameIndex } from "process-def";
import type {
  KeyValuePair,
  Value as PythonValue,
  Variables as PythonVariables,
  ResolvedObjectVal,
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
  getCollectionElements(
    id: AddressStr,
    frameIndex: number,
    startIndex: number,
    elementCount: number,
  ): Promise<PythonValue[]>;
  getStringContents(
    id: AddressStr,
    frameIndex: number,
    startIndex: number,
    length: number,
  ): Promise<string>;
  getDictEntries(
    id: AddressStr,
    frameIndex: number,
    startIndex: number,
    pairCount: number,
  ): Promise<KeyValuePair[]>;
  getObject(id: AddressStr, frameIndex: number): Promise<ResolvedObjectVal>;
}
