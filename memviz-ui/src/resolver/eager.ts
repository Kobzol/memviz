import {
  type Address,
  type AddressStr,
  PlaceKind,
  type ProcessState,
  type StackFrame,
  type TyArray,
  type TyFloat,
  type TyInt,
  type TyPtr,
  type Type,
} from "process-def";
import type { Place } from "process-def/src";
import type { HeapAllocation } from "../allocation-tracker";
import { MemoryMap } from "../memory-map";
import type { MemoryAllocEvent } from "../messages";
import { assert, addressToStr, strToAddress } from "../utils";
import type { TyChar } from "../visualization/utils/types";
import type { ProcessResolver } from "./resolver";

export interface FullProcessState extends ProcessState {
  stackTrace: FullStackTrace;
  memory: MemoryMap;
  heapAllocations: HeapAllocation[];
}

interface FullStackTrace {
  frames: FullStackFrame[];
}

interface FullStackFrame extends StackFrame {
  places: Place[];
}

export class EagerResolver implements ProcessResolver {
  constructor(private state: FullProcessState) {}

  async readMemory(address: AddressStr, size: number): Promise<ArrayBuffer> {
    console.log(`Resolving address ${address} (${size} bytes)`);
    const res = this.state.memory.readZeroFilled(
      strToAddress(address),
      BigInt(size),
    );
    if (res === null) {
      throw new Error(`Reading invalid memory at ${address} (${size} byte(s))`);
    }
    return res;
  }

  async getPlaces(frameIndex: number): Promise<Place[]> {
    return this.state.stackTrace.frames[frameIndex].places;
  }

  async takeAllocEvents(): Promise<MemoryAllocEvent[]> {
    return this.state.heapAllocations.map(({ address, size }) => ({
      kind: "mem-allocated",
      address: addressToStr(address),
      size,
    }));
  }
}

type BuilderFrame = Omit<FullStackFrame, "id" | "index"> & {
  baseAddress: Address;
  topAddress: Address;
};

export class ProcessBuilder {
  private map: MemoryMap = new MemoryMap();
  private frames: BuilderFrame[] = [];
  private activeFrame: BuilderFrame | null = null;
  private heapAllocations: HeapAllocation[] = [];

  // Move stack a bit up to avoid data sitting at address 0
  private baseStackAddress: Address = BigInt(1000);
  private baseHeapAddress: Address = BigInt(100 * 1000 * 1000);

  startFrame(
    name: string,
    address: Address | null = null,
    line: number | null = null,
    file = "main.c",
  ) {
    if (this.activeFrame !== null) {
      this.endFrame();
    }

    let addr = address;
    if (addr === null) {
      if (this.frames.length > 0) {
        addr = this.frames[this.frames.length - 1].topAddress + BigInt(16);
      } else {
        addr = this.baseStackAddress;
      }
    }

    const actualLine = line ?? (this.frames.length + 1) * 20;
    this.activeFrame = {
      name,
      line: actualLine,
      file,
      places: [],
      baseAddress: addr,
      topAddress: addr,
    };
  }

  place(
    name: string,
    type: Type,
    kind: PlaceKind = PlaceKind.Variable,
    initialized = true,
    address: bigint | null = null,
    line: number | null = null,
  ): PlaceBuilder {
    assert(this.activeFrame !== null, "no frame is active");

    let addr = address;
    if (addr === null) {
      addr = this.activeFrame.topAddress;
    } else {
      addr += this.activeFrame.baseAddress;
    }

    const actualLine = line ?? this.activeFrame.places.length + 1;
    this.activeFrame.places.push({
      name,
      address: addressToStr(addr),
      kind,
      type,
      initialized,
      line: actualLine,
    });
    this.activeFrame.topAddress += BigInt(type.size);
    return new PlaceBuilder(addr, this.map);
  }

  endFrame() {
    if (this.activeFrame === null) {
      throw new Error("No frame is active");
    }
    this.frames.push(this.activeFrame);
    this.activeFrame = null;
  }

  allocHeap(address: Address, size: number): PlaceBuilder {
    address += this.baseHeapAddress;
    this.heapAllocations.push({
      address,
      size,
    });
    return new PlaceBuilder(address, this.map);
  }

  build(): [FullProcessState, EagerResolver] {
    if (this.activeFrame !== null) {
      this.endFrame();
    }

    const frames = this.frames.slice().reverse();

    const processState: FullProcessState = {
      stackTrace: {
        frames: frames.map((f, index) => ({ ...f, id: index, index })),
      },
      stackAddressRange: {
        start: "0x0",
        end: "0x1000",
      },
      memory: this.map,
      heapAllocations: this.heapAllocations,
    };
    return [processState, new EagerResolver(processState)];
  }
}

export class PlaceBuilder {
  constructor(
    public address: Address,
    private map: MemoryMap,
  ) {}

  setArray(
    generator: (index: number) => ArrayBuffer,
    count: number,
  ): PlaceBuilder {
    let address = this.address;
    for (let i = 0; i < count; i++) {
      const buffer = generator(i);
      this.map.set(address, buffer);
      address += BigInt(buffer.byteLength);
    }
    return this;
  }
  setCString(text: string): PlaceBuilder {
    const str = new TextEncoder().encode(text);
    const buffer = new ArrayBuffer(str.byteLength + 1);
    new Uint8Array(buffer).set(str);
    this.map.set(this.address, buffer);
    return this;
  }
  setUint32(value: number): PlaceBuilder {
    this.map.set(this.address, makeUint32(value));
    return this;
  }
  setFloat32(value: number): PlaceBuilder {
    this.map.set(this.address, makeFloat32(value));
    return this;
  }
  setPtr(value: Address): PlaceBuilder {
    this.map.set(this.address, makeUint64(value));
    return this;
  }
}

export function typeUint32(name = "int"): TyInt {
  return {
    name,
    kind: "int",
    signed: false,
    size: 4,
  };
}

export function typeChar(name = "char"): TyChar {
  return {
    name,
    kind: "int",
    size: 1,
    signed: false,
  };
}

export function typeFloat32(name = "float"): TyFloat {
  return {
    name,
    kind: "float",
    size: 4,
  };
}

export function typeArray(type: Type, elementCount: number): TyArray {
  return {
    name: `${type.name}[${elementCount}]`,
    kind: "array",
    size: type.size * elementCount,
    type,
    element_count: elementCount,
  };
}

export function typePtr(target: Type): TyPtr {
  return {
    name: `${target.name}*`,
    kind: "ptr",
    size: 8,
    target,
  };
}

export function makeUint32(value: number): ArrayBuffer {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setUint32(0, value, true);
  return buffer;
}

export function makeUint64(value: bigint): ArrayBuffer {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, value, true);
  return buffer;
}

export function makeFloat32(value: number): ArrayBuffer {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setFloat32(0, value, true);
  return buffer;
}
