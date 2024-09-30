type Component = string;

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
    return this.with(arrayIndexComponent(index));
  }

  length(): number {
    return this.components.length;
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
