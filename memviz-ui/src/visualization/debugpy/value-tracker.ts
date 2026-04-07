import type { PythonId } from "process-def/debugpy";
import { reactive } from "vue";
import type { RichValue } from "./type/type";

export class ValueTracker {
  private values = reactive(new Map<PythonId, RichValue>());

  getOrderedValues(rootValueIds: PythonId[]): RichValue[] {
    // pre-order DFS so parent values come before their children
    const ordered: RichValue[] = [];
    const visited = new Set<PythonId>();

    const dfs = (id: PythonId) => {
      if (visited.has(id)) return;
      visited.add(id);

      const val = this.values.get(id);
      if (!val) return;

      ordered.push(val);

      const innerIds = val.getFetchedChildIds() ?? [];
      for (const innerId of innerIds) {
        dfs(innerId);
      }
    };

    for (const rootId of rootValueIds) {
      dfs(rootId);
    }

    for (const val of this.values.values()) {
      if (!visited.has(val.id)) {
        dfs(val.id);
      }
    }

    return ordered;
  }

  addValues(values: RichValue[]) {
    for (const value of values) {
      this.addValue(value);
    }
  }

  addValue(value: RichValue) {
    if (!this.values.has(value.id)) {
      this.values.set(value.id, value);
    }
  }

  getValue(id: PythonId): RichValue | null {
    return this.values.get(id) ?? null;
  }

  getValueOrThrow(id: PythonId): RichValue {
    const val = this.values.get(id);
    if (!val) {
      throw new Error(`Value with id ${id} not found`);
    }
    return val;
  }

  clear() {
    this.values.clear();
  }
}
