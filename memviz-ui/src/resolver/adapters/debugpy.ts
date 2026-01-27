import type { AddressStr, FrameIndex } from "process-def";

import type { KeyValuePair, Value } from "process-def/debugpy";

import type {
  RichAttribute,
  RichVariables,
} from "../../visualization/debugpy/type/type";
import type { ProcessResolverCore } from "../core";

export class DebugpyResolver {
  constructor(protected resolver: ProcessResolverCore) {}
  async createVariablesRepresentation(
    frameIndex: FrameIndex,
  ): Promise<RichVariables> {
    return this.resolver.createVariablesRepresentation(frameIndex);
  }
  getFlatCollectionElements(
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<Value[]> {
    return this.resolver.getFlatCollectionElements(id, startIndex, count);
  }
  getStringContents(
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<string> {
    return this.resolver.getStringContents(id, startIndex, count);
  }
  getDictEntries(
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<KeyValuePair[]> {
    return this.resolver.getDictEntries(id, startIndex, count);
  }
  getObject(id: AddressStr): Promise<RichAttribute[]> {
    return this.resolver.getObject(id);
  }
}
