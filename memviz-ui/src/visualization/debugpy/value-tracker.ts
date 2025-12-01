import type { PythonId, Value } from "process-def/debugpy";
import { reactive } from "vue";

export class ValueTracker {
  private values = reactive(new Map<PythonId, Value>());

  getValues(): Value[] {
    return Array.from(this.values.values());
  }

  addValues(values: Value[]) {
    console.log("Adding values:", values);
    for (const value of values) {
      this.values.set(value.id, value);
    }
  }

  getValueById(id: PythonId): Value | null {
    return this.values.get(id) ?? null;
  }
}
