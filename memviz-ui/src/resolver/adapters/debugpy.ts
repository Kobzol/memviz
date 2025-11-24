import type { AddressStr, FrameIndex } from "process-def";
import type {
  KeyValuePair,
  ResolvedObjectVal,
  Value,
  Variables,
} from "process-def/debugpy";
import type { ProcessResolverCore } from "../core";

export class DebugpyResolver {
  constructor(protected resolver: ProcessResolverCore) {}
  createVariablesRepresentation(frameIndex: FrameIndex): Promise<Variables> {
    return this.resolver.createVariablesRepresentation(frameIndex);
  }
  getCollectionElements(
    id: AddressStr,
    startIndex: number,
    elementCount: number,
  ): Promise<Value[]> {
    return this.resolver.getCollectionElements(id, startIndex, elementCount);
  }
  getStringContents(
    id: AddressStr,
    startIndex: number,
    length: number,
  ): Promise<string> {
    return this.resolver.getStringContents(id, startIndex, length);
  }
  getDictEntries(
    id: AddressStr,
    startIndex: number,
    pairCount: number,
  ): Promise<KeyValuePair[]> {
    return this.resolver.getDictEntries(id, startIndex, pairCount);
  }
  getObject(id: AddressStr): Promise<ResolvedObjectVal> {
    return this.resolver.getObject(id);
  }
}
