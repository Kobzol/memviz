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

  async getCollectionElements(
    id: AddressStr,
    elementIndices: number[],
  ): Promise<RichValue[]> {
    return await super.getCollectionElements(id, elementIndices);
  }

  async getStringContents(
    id: AddressStr,
    charIndices: number[],
  ): Promise<string> {
    return await super.getStringContents(id, charIndices);
  }

  async getDictEntries(
    id: AddressStr,
    pairIndices: number[],
  ): Promise<RichKeyValuePair[]> {
    return await super.getDictEntries(id, pairIndices);
  }

  async getObject(id: AddressStr): Promise<Attribute[]> {
    return await super.getObject(id);
  }
}
