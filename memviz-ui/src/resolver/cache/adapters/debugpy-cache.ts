import type { AddressStr, FrameIndex } from "process-def";
import type {
  KeyValuePair,
  ResolvedObjectVal,
  Value,
  Variables,
} from "process-def/debugpy";
import { DebugpyResolver } from "../../adapters/debugpy";

export class CachingDebugpyResolver extends DebugpyResolver {
  async createVariablesRepresentation(
    frameIndex: FrameIndex,
  ): Promise<Variables> {
    return await super.createVariablesRepresentation(frameIndex);
  }

  async getCollectionElements(
    id: AddressStr,
    elementCount: number,
    startIndex: number,
  ): Promise<Value[]> {
    return await super.getCollectionElements(id, elementCount, startIndex);
  }

  async getStringContents(
    id: AddressStr,
    startIndex: number,
    length: number,
  ): Promise<string> {
    return await super.getStringContents(id, startIndex, length);
  }

  async getDictEntries(
    id: AddressStr,
    startIndex: number,
    pairCount: number,
  ): Promise<KeyValuePair[]> {
    return await super.getDictEntries(id, startIndex, pairCount);
  }

  async getObject(id: AddressStr): Promise<ResolvedObjectVal> {
    return await super.getObject(id);
  }
}
