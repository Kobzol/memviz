import { formatAddress } from "../utils/formatting";

type Component = string;

// Represents an "access point" to some value from a root (global scope/stack frame/heap)
export class Path {
  static heapAlloc(address: bigint): Path {
    return new Path([heapAllocComponent(address)]);
  }
  static stackFrame(index: number): Path {
    return new Path([stackFrameComponent(index)]);
  }

  private readonly components: ReadonlyArray<Component> = [];

  constructor(components: Component[]) {
    this.components = [...components];
  }

  makeStackFramePlace(name: string): Path {
    return this.with(stackFramePlaceComponent(name));
  }

  makeArrayIndex(index: number): Path {
    return this.with(arrayIndexComponent(index));
  }

  makeStructField(name: string): Path {
    return this.with(structFieldComponent(name));
  }

  makeByteElement(index: number): Path {
    return this.with(byteElementComponent(index));
  }

  length(): number {
    return this.components.length;
  }

  format(): string {
    return this.components.join("/");
  }

  private with(component: Component): Path {
    const components = [...this.components];
    components.push(component);
    return new Path(components);
  }
}

function stackFrameComponent(index: number): Component {
  return `s-${index}`;
}
function stackFramePlaceComponent(name: string): Component {
  return `p-${name}`;
}

function arrayIndexComponent(index: number): Component {
  return `i-${index}`;
}

function structFieldComponent(name: string): Component {
  return `f-${name}`;
}

function byteElementComponent(index: number): Component {
  return `b-${index}`;
}

function heapAllocComponent(address: bigint): Component {
  return `h-${formatAddress(address)}`;
}
