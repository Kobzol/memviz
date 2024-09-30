// Represents an "access point" to some value from a root (global scope/stack frame/heap)
export class Path {
  static stackFrame(index: number): Path {
    return new Path([stackFrameComponent(index)]);
  }
  static stackFramePlace(name: string): Path {
    return new Path([stackFramePlaceComponent(name)]);
  }

  private readonly components: ReadonlyArray<Component> = [];

  constructor(components: Component[]) {
    this.components = [...components];
  }

  makeArrayIndex(index: number): Path {
    const components = this.clone();
    components.push(arrayIndexComponent(index));
    return new Path(components);
  }

  length(): number {
    return this.components.length;
  }

  private clone(): Component[] {
    return [...this.components];
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

type Component = string;
