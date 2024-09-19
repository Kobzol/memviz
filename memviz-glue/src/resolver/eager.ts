import {
  type Address,
  type AddressStr,
  PlaceKind,
  type ProcessState,
  type Type,
} from "process-def";
import type { Place } from "process-def/src";
import { MemoryMap } from "../memory-map";
import { addressToStr, strToAddress } from "../utils";
import type { ProcessResolver } from "./resolver";

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
    console.log(`Resolving address ${address} (${size} bytes)`);
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

type BuilderFrame = Omit<FullStackFrame, "id" | "index"> & {
  baseAddress: bigint;
};

export class ProcessBuilder {
  private map: MemoryMap = new MemoryMap();
  private frames: BuilderFrame[] = [];
  private activeFrame: BuilderFrame | null = null;

  startFrame(name: string, baseAddress: number) {
    if (this.activeFrame !== null) {
      this.endFrame();
    }
    this.activeFrame = {
      name,
      places: [],
      baseAddress: BigInt(baseAddress),
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

    const finalAddress = this.activeFrame.baseAddress + address;
    this.activeFrame.places.push({
      name,
      address: addressToStr(finalAddress),
      kind,
      type,
      initialized,
    });
    return new PlaceBuilder(finalAddress, this.map);
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

    const frames = this.frames.slice().reverse();

    this.map.dump();

    const processState: FullProcessState = {
      stackTrace: {
        frames: frames.map((f, index) => ({ ...f, id: index, index })),
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

function makeUint32(value: number): ArrayBuffer {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setUint32(0, value, true);
  return buffer;
}
