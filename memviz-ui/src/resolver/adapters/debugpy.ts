import type { AddressStr, FrameIndex } from "process-def";

import type {
  DeferredStrVal,
  KeyValuePair,
  ResolvedObjectVal,
  Value,
} from "process-def/debugpy";

import { assert } from "../../utils";
import { LazyStrVal } from "../../visualization/debugpy/lazy-sequence";
import { valueState } from "../../visualization/debugpy/store";
import type {
  RichValue,
  RichVariables,
} from "../../visualization/debugpy/type";
import type { ProcessResolverCore } from "../core";

export class DebugpyResolver {
  constructor(protected resolver: ProcessResolverCore) {}
  async createVariablesRepresentation(
    frameIndex: FrameIndex,
  ): Promise<RichVariables> {
    const res = await this.resolver.createVariablesRepresentation(frameIndex);
    const newRichValues: RichValue[] = [];
    const richValues = res.values.map((val) => {
      const existingVal = valueState.value.getValueById(val.id);
      if (existingVal) {
        assert(existingVal.kind === val.kind, "Mismatched kinds for value id");
        return existingVal;
      }
      if (val.kind === "str") {
        const strVal = val as DeferredStrVal;
        const richVal = new LazyStrVal(
          strVal.id,
          strVal.size,
          strVal.length,
          strVal.content,
        );
        newRichValues.push(richVal);
        return richVal;
      }
      const richVal = val as RichValue;
      newRichValues.push(richVal);
      return richVal;
    });

    valueState.value.addValues(newRichValues);
    return {
      places: res.places,
      values: richValues,
    };
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
