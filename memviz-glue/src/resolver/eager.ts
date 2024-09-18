import type { Place } from "process-def/src";
import type { ProcessResolver } from "./resolver";
import {
  type Address,
  type AddressStr,
  PlaceKind,
  type ProcessState,
  type Type,
} from "process-def";
import { makeUint32, MemoryMap } from "../memory-map";
import { addressToStr, strToAddress } from "../utils";

export interface FullProcessState extends ProcessState {
  stackTrace: FullStackTrace;
  memory: MemoryMap;
}

interface FullStackTrace {
  frames: FullStackFrame[];
}

interface FullStackFrame {
  id: number;
  index: number;
  name: string;
  places: Place[];
}

export class EagerResolver implements ProcessResolver {
  constructor(private state: FullProcessState) {}

  async readMemory(address: AddressStr, size: number): Promise<ArrayBuffer> {
    const res = this.state.memory.read(strToAddress(address), BigInt(size));
    if (res === null) {
      throw new Error(`Reading invalid memory at ${address} (${size} byte(s))`);
    }
    return res.buffer.slice(res.byteOffset, res.byteOffset + res.byteLength);
  }

  async getPlaces(frameIndex: number): Promise<Place[]> {
    return this.state.stackTrace.frames[frameIndex].places;
  }
}

export class ProcessBuilder {
  private map: MemoryMap = new MemoryMap();
  private frames: FullStackFrame[] = [];
  private activeFrame: FullStackFrame | null = null;

  startFrame(name: string) {
    if (this.activeFrame !== null) {
      this.endFrame();
    }
    this.activeFrame = {
      id: this.frames.length,
      index: this.frames.length,
      name,
      places: [],
    };
  }

  place(
    name: string,
    address: bigint,
    type: Type,
    kind: PlaceKind = PlaceKind.Variable,
    initialized = true,
  ): PlaceBuilder {
    if (this.activeFrame === null) {
      throw new Error("No frame is active");
    }
    this.activeFrame.places.push({
      name,
      address: addressToStr(address),
      kind,
      type,
      initialized,
    });
    return new PlaceBuilder(address, this.map);
  }

  endFrame() {
    if (this.activeFrame === null) {
      throw new Error("No frame is active");
    }
    this.frames.push(this.activeFrame);
    this.activeFrame = null;
  }

  build(): [ProcessState, EagerResolver] {
    if (this.activeFrame !== null) {
      this.endFrame();
    }

    const processState: FullProcessState = {
      stackTrace: {
        frames: this.frames,
      },
      stackAddressRange: {
        start: "0x0",
        end: "0x1000",
      },
      memory: this.map,
    };
    return [processState, new EagerResolver(processState)];
  }
}

export class PlaceBuilder {
  constructor(
    private address: Address,
    private map: MemoryMap,
  ) {}

  setUint32(value: number) {
    this.map.set(this.address, makeUint32(value));
  }
}

export function typeUint32(name = "int"): Type {
  return {
    name,
    kind: "int",
    signed: false,
    size: 4,
  };
}
