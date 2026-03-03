<script setup lang="ts">
import { computed, ComputedRef } from "vue";
import { DisplayMode, valueDisplaySettings } from "../value-display-settings";
import ValueRef from "./value/value-ref.vue";
import ValueComponent from "./value/value.vue";
import HeapBlock from "./heap/heap-block.vue";
import { PythonId } from "process-def/debugpy";
import { valueState } from "../store";

const props = withDefaults(
  defineProps<{
    id: PythonId;
    context?: DisplayMode;
  }>(),
  {
    context: DisplayMode.INLINE,
  },
);

const valueDisplayMode: ComputedRef<DisplayMode> = computed(
  () => valueDisplaySettings.get(pythonValue.value.kind) || DisplayMode.INLINE,
);
const pythonValue = computed(() => {
  return valueState.value.getValueOrThrow(props.id);
});
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
