import type { AddressStr, FrameIndex } from "process-def";
import type { Place as GDBPlace } from "process-def/gdb";
import type { MemoryAllocEvent } from "../messages";
import type {
  RichAttribute,
  RichKeyValuePair,
  RichVariables as RichPythonVariables,
  RichValue,
} from "../visualization/debugpy/type/type";

export interface ProcessResolverCore {
  getPlaces(frameIndex: FrameIndex): Promise<GDBPlace[]>;
  readMemory(address: AddressStr, size: number): Promise<ArrayBuffer>;
  takeAllocEvents(): Promise<MemoryAllocEvent[]>;
  createVariablesRepresentation(
    frameIndex: FrameIndex,
  ): Promise<RichPythonVariables>;
  getFlatCollectionElements(
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<RichValue[]>;
  getStringContents(
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<string>;
  getDictEntries(
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<RichKeyValuePair[]>;
  getObject(id: AddressStr): Promise<RichAttribute[]>;
}
