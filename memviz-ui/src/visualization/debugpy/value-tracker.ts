import type { PythonId } from "process-def/debugpy";
import { reactive } from "vue";
import type { RichValue } from "./type/type";

export class ValueTracker {
  private values = reactive(new Map<PythonId, RichValue>());

  getValues(): RichValue[] {
    return Array.from(this.values.values());
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
}
