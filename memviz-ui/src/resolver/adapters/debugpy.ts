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
  getCollectionElements(
    id: AddressStr,
    elementIndices: number[],
  ): Promise<Value[]> {
    return this.resolver.getCollectionElements(id, elementIndices);
  }
  getStringContents(id: AddressStr, charIndices: number[]): Promise<string> {
    return this.resolver.getStringContents(id, charIndices);
  }
  getDictEntries(
    id: AddressStr,
    pairIndices: number[],
  ): Promise<KeyValuePair[]> {
    return this.resolver.getDictEntries(id, pairIndices);
  }
  getObject(id: AddressStr): Promise<RichAttribute[]> {
    return this.resolver.getObject(id);
  }
}
