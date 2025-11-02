import type { AddressStr, FrameIndex } from "process-def";
import type {
  KeyValuePair,
  ObjectVal,
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
  getObject(id: AddressStr, frameIndex: number): Promise<ObjectVal>;
}
