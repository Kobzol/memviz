// Represents an "access point" to some value from a root (global scope/stack frame/heap)
export class Path {
  static rootStackFrame(name: string): Path {
    return new Path([stackPlaceComponent(name)]);
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

function stackPlaceComponent(name: string): Component {
  return `s-${name}`;
}

function arrayIndexComponent(index: number): Component {
  return `i-${index}`;
}

type Component = string;
