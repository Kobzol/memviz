<script setup lang="ts">
import { computed } from "vue";
import type { PythonId } from "process-def/debugpy";
import {
  DisplayMode,
  valueDisplaySettings,
} from "../../value-display-settings";
import { frameVisibilityState, valueState } from "../../store";
import { appState } from "../../../store";
import MemorySlot from "../memory-slot.vue";
import type { RichValue } from "../../type/type";

function isDetachedValue(value: RichValue): boolean {
  return (
    (valueDisplaySettings.get(value.kind) ?? DisplayMode.INLINE) ===
    DisplayMode.DETACHED
  );
}

function collectReachableIds(
  valuesById: Map<PythonId, RichValue>,
): Set<PythonId> {
  const queue = [...visibleRootIds.value];
  const reachableIds = new Set(queue);

  while (queue.length > 0) {
    const id = queue.pop();
    if (!id) continue;

    const value = valuesById.get(id);
    if (!value) continue;

    for (const childId of value.getFetchedChildIds()) {
      if (reachableIds.has(childId)) continue;

      queue.push(childId);
      reachableIds.add(childId);
    }
  }

  return reachableIds;
}

const visibleRootIds = computed(() => {
  const orderedFrameIds = appState.value.processState.stackTrace.frames
    .slice()
    .sort((a, b) => b.index - a.index)
    .map((frame) => frame.id);
  return frameVisibilityState.getOrderedVisibleSourceObjectIds(orderedFrameIds);
});

const values = computed(() =>
  valueState.value.getOrderedValues(visibleRootIds.value),
);

const visibleValues = computed(() => {
  const valuesById = new Map(values.value.map((value) => [value.id, value]));
  const visibleIds = collectReachableIds(valuesById);

  return values.value.filter(
    (value) => isDetachedValue(value) && visibleIds.has(value.id),
  );
});
</script>

<template>
  <div class="heap" v-if="visibleValues.length > 0">
    <div class="header">Heap</div>
    <MemorySlot
      v-for="value in visibleValues"
      :key="value.id"
      :id="value.id"
      :context="DisplayMode.DETACHED"
    />
  </div>
</template>

<style lang="scss" scoped>
.heap {
  min-width: 300px;
  max-width: 500px;
}

.header {
  padding: 4px 0;
  text-align: center;
  font-weight: bold;
  border-radius: 10px 10px 0 0;
  background-color: #8ccdff;
}
</style>
