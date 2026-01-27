import type { AddressStr, FrameIndex } from "process-def";
import type { Attribute } from "process-def/debugpy";
import type {
  RichKeyValuePair,
  RichValue,
  RichVariables,
} from "../../../visualization/debugpy/type/type";
import { DebugpyResolver } from "../../adapters/debugpy";

export class CachingDebugpyResolver extends DebugpyResolver {
  async createVariablesRepresentation(
    frameIndex: FrameIndex,
  ): Promise<RichVariables> {
    return await super.createVariablesRepresentation(frameIndex);
  }

  async getFlatCollectionElements(
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<RichValue[]> {
    return await super.getFlatCollectionElements(id, startIndex, count);
  }

  async getStringContents(
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<string> {
    return await super.getStringContents(id, startIndex, count);
  }

  async getDictEntries(
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<RichKeyValuePair[]> {
    return await super.getDictEntries(id, startIndex, count);
  }

  async getObject(id: AddressStr): Promise<Attribute[]> {
    return await super.getObject(id);
  }
}
