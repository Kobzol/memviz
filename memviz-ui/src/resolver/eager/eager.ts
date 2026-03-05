import type { AddressStr, FrameIndex, StoppedPlace } from "process-def";
import type { Place } from "process-def/gdb";
import type { MemoryAllocEvent } from "../../messages";
import { addressToStr, strToAddress } from "../../utils";
import type {
  RichAttribute,
  RichKeyValuePair,
  RichVariables as RichPythonVariables,
  RichValue,
} from "../../visualization/debugpy/type/type";
import { rawToRichValues } from "../../visualization/debugpy/type/value-mapper";
import type { ProcessResolverCore } from "../core";
import type { FullProcessState as FullDebugpyProcessState } from "./utils/debugpy";
import type { FullProcessState as FullGdbProcessState } from "./utils/gdb";

export class EagerResolver implements ProcessResolverCore {
  constructor(
    private gdbState?: FullGdbProcessState,
    private debugpyState?: FullDebugpyProcessState,
  ) {}

  async readMemory(address: AddressStr, size: number): Promise<ArrayBuffer> {
    const state = this.gdbState;
    if (!state) {
      throw new Error(
        "GDB state not provided to EagerResolver but needed for readMemory",
      );
    }
    console.log(`Resolving address ${address} (${size} bytes)`);
    const res = state.memory.readZeroFilled(
      strToAddress(address),
      BigInt(size),
    );
    if (res === null) {
      throw new Error(`Reading invalid memory at ${address} (${size} byte(s))`);
    }
    return res;
  }

  async getPlaces(frameIndex: FrameIndex): Promise<Place[]> {
    const state = this.gdbState;
    if (!state) {
      throw new Error(
        "GDB state not provided to EagerResolver but needed for getPlaces",
      );
    }
    return state.stackTrace.frames[frameIndex].places;
  }

  async createVariablesRepresentation(
    frame: StoppedPlace,
  ): Promise<RichPythonVariables> {
    const state = this.debugpyState;
    if (!state) {
      throw new Error(
        "Debugpy state not provided to EagerResolver but needed for createVariablesRepresentation",
      );
    }

    const stackFrame = state.stackTrace.frames.find((f) => f.id === frame.id);
    if (!stackFrame) {
      throw new Error(`No stack frame found for frame id ${frame.id}`);
    }

    const variables = state.frameVariables.get(stackFrame.index);
    if (!variables) {
      throw new Error(`No variables found for frame index ${stackFrame.index}`);
    }

    return {
      places: variables.places,
      values: rawToRichValues(variables.values),
    };
  }

  async getFlatCollectionElements(
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<RichValue[]> {
    const state = this.debugpyState;
    if (!state) {
      throw new Error(
        "Debugpy state not provided to EagerResolver but needed for getFlatCollectionElements",
      );
    }

    const elements = state.collectionElements.get(id);
    if (!elements) {
      throw new Error(`No collection elements found for id ${id}`);
    }

    const sliced = elements.slice(startIndex, startIndex + count);
    return rawToRichValues(sliced);
  }

  async getStringContents(
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<string> {
    const state = this.debugpyState;
    if (!state) {
      throw new Error(
        "Debugpy state not provided to EagerResolver but needed for getStringContents",
      );
    }

    const content = state.stringContents.get(id);
    if (content === undefined) {
      throw new Error(`No string content found for id ${id}`);
    }

    return Array.from(content)
      .slice(startIndex, startIndex + count)
      .join("");
  }

  async getDictEntries(
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<RichKeyValuePair[]> {
    const state = this.debugpyState;
    if (!state) {
      throw new Error(
        "Debugpy state not provided to EagerResolver but needed for getDictEntries",
      );
    }

    const pairs = state.dictPairs.get(id);
    if (!pairs) {
      throw new Error(`No dict pairs found for id ${id}`);
    }

    const sliced = pairs.slice(startIndex, startIndex + count);
    return sliced.map((pair) => ({
      key: rawToRichValues([pair.key])[0],
      value: rawToRichValues([pair.value])[0],
    }));
  }

  async getObject(id: AddressStr): Promise<RichAttribute[]> {
    const state = this.debugpyState;
    if (!state) {
      throw new Error(
        "Debugpy state not provided to EagerResolver but needed for getObject",
      );
    }

    const attributes = state.objectAttributes.get(id);
    if (!attributes) {
      throw new Error(`No object attributes found for id ${id}`);
    }

    return attributes.map((attr) => ({
      name: attr.name,
      value: attr.value ? rawToRichValues([attr.value])[0] : null,
      is_descriptor: attr.is_descriptor,
    }));
  }

  async takeAllocEvents(): Promise<MemoryAllocEvent[]> {
    const state = this.gdbState;
    if (!state) {
      throw new Error(
        "GDB state not provided to EagerResolver but needed for takeAllocEvents",
      );
    }

    return state.heapAllocations.flatMap(({ address, size, active }) => {
      const events: MemoryAllocEvent[] = [
        {
          kind: "mem-allocated",
          address: addressToStr(address),
          size,
        },
      ];
      if (!active) {
        events.push({
          kind: "mem-freed",
          address: addressToStr(address),
        });
      }
      return events;
    });
  }
}
