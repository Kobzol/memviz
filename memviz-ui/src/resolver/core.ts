import type { AddressStr, FrameIndex } from "process-def";
import type { Attribute } from "process-def/debugpy";
import type { Place as GDBPlace } from "process-def/gdb";
import type { MemoryAllocEvent } from "../messages";
import type {
  RichKeyValuePair,
  RichValue,
  RichVariables,
} from "../visualization/debugpy/type/type";

export interface ProcessResolverCore {
  getPlaces(frameIndex: FrameIndex): Promise<GDBPlace[]>;
  readMemory(address: AddressStr, size: number): Promise<ArrayBuffer>;
  takeAllocEvents(): Promise<MemoryAllocEvent[]>;
  createVariablesRepresentation(frameIndex: FrameIndex): Promise<RichVariables>;
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
  getObject(id: AddressStr): Promise<Attribute[]>;
}
