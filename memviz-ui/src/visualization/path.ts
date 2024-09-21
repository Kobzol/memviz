// Represents an "access point" to some value from a root (global scope/stack frame/heap)
export class Path {
  static rootStackFrame(name: string): Path {
    return new Path([stackPlaceComponent(name)]);
  }

  private components: Component[] = [];

  constructor(components: Component[]) {
    this.components = [...components];
  }

  makeArrayIndex(index: number): Path {
    const path = this.clone();
    path.components.push(arrayIndexComponent(index));
    return path;
  }

  length(): number {
    return this.components.length;
  }

  private clone(): Path {
    return new Path(this.components);
  }
}

function stackPlaceComponent(name: string): Component {
  return `s-${name}`;
}

function arrayIndexComponent(index: number): Component {
  return `i-${index}`;
}

type Component = string;
