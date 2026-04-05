import type { PythonId } from "process-def/debugpy";

export interface ComponentStateValue {
  kind: string;
  isOpen: boolean;
  collectionPageIndex?: number;
  collectionItemCount?: number;
}

export class ComponentState {
  private cache = new Map<PythonId, ComponentStateValue>();

  getState(id: PythonId, currentKind: string): ComponentStateValue | undefined {
    const state = this.cache.get(id);
    if (state && state.kind !== currentKind) {
      // if the kind has changed, the cached state is no longer valid
      this.cache.delete(id);
      return undefined;
    }
    return state;
  }

  setState(id: PythonId, state: ComponentStateValue): void {
    this.cache.set(id, state);
  }

  clear(): void {
    this.cache.clear();
  }
}
