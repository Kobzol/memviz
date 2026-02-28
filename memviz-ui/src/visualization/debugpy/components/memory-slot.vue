<script setup lang="ts">
import { computed, ComputedRef } from "vue";
import { DisplayMode, valueDisplaySettings } from "../value-display-settings";
import ValueRef from "./value/value-ref.vue";
import ValueComponent from "./value/value.vue";
import HeapBlock from "./heap/heap-block.vue";
import { PythonId } from "process-def/debugpy";
import { valueState } from "../store";
import { isDict, isFlatCollection, isNone, isObject } from "../utils/types";
import type { RichValue } from "../type/type";

const props = withDefaults(
  defineProps<{
    id: PythonId;
    context?: DisplayMode;
    showDetachedHeapInfo?: boolean;
  }>(),
  {
    context: DisplayMode.INLINE,
    showDetachedHeapInfo: false,
  },
);

const valueDisplayMode: ComputedRef<DisplayMode> = computed(
  () => valueDisplaySettings.get(pythonValue.value.kind) || DisplayMode.INLINE,
);
const pythonValue = computed(() => {
  return valueState.value.getValueOrThrow(props.id);
});

function getValueTypeTitle(value: RichValue): string {
  if (isNone(value)) {
    return "none";
  }
  if (isObject(value)) {
    return value.type_name;
  }
  if (isFlatCollection(value)) {
    return `${value.kind}[${value.element_count}]`;
  }
  if (isDict(value)) {
    return `${value.kind}[${value.pair_count}]`;
  }
  return value.kind;
}

const detachedTypeLabel = computed(() =>
  getValueTypeTitle(pythonValue.value as RichValue),
);
</script>

<template>
  <ValueComponent
    v-if="
      context === DisplayMode.INLINE && valueDisplayMode === DisplayMode.INLINE
    "
    :id="props.id"
  />
  <ValueRef
    v-else-if="
      context === DisplayMode.INLINE &&
      valueDisplayMode === DisplayMode.DETACHED
    "
    :id="props.id"
    :showDetachedHeapInfo="showDetachedHeapInfo"
    :text="detachedTypeLabel"
  />
  <HeapBlock
    v-else-if="
      context === DisplayMode.DETACHED &&
      valueDisplayMode === DisplayMode.DETACHED
    "
    :id="props.id"
  />
  <!-- in case of detached context and inline value display mode, nothing is shown -->
</template>
