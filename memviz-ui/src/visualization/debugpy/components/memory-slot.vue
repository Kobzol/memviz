<script setup lang="ts">
import type { Value } from "process-def/debugpy";
import { computed, ComputedRef, PropType } from "vue";
import { DisplayMode, valueDisplaySettings } from "../value-display-settings";
import ValueRef from "./value/value-ref.vue";
import ValueComponent from "./value/value.vue";
import HeapBlock from "./heap/heap-block.vue";

const props = defineProps({
  value: {
    type: Object as PropType<Value>,
    required: true,
  },
  context: {
    type: String as PropType<DisplayMode>,
    default: DisplayMode.INLINE,
  },
});

const valueDisplayMode: ComputedRef<DisplayMode> = computed(
  () => valueDisplaySettings.get(props.value.kind) || DisplayMode.INLINE
);
</script>

<template>
  <ValueComponent
    v-if="
      context === DisplayMode.INLINE && valueDisplayMode === DisplayMode.INLINE
    "
    :value="value"
  />
  <ValueRef
    v-else-if="
      context === DisplayMode.INLINE &&
      valueDisplayMode === DisplayMode.DETACHED
    "
    :value="value"
  />
  <HeapBlock
    v-else-if="
      context === DisplayMode.DETACHED &&
      valueDisplayMode === DisplayMode.DETACHED
    "
    :value="value"
  />
  <!-- in case of detached context and inline value display mode, nothing is shown -->
</template>

<style scoped lang="scss">
.value {
  display: flex;
  flex-direction: column;
}
</style>
