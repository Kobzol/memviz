<script setup lang="ts">
import type { Value } from "process-def/debugpy";
import {
  onBeforeUnmount,
  onMounted,
  onUpdated,
  PropType,
  shallowRef,
  ShallowRef,
  watch,
} from "vue";
import { debugpyComponentMap } from "../../../store";
import { LeaderLineWithId } from "../../component-map";

const props = defineProps({
  value: {
    type: Object as PropType<Value>,
    required: true,
  },
});

function tryRemoveArrow() {
  if (arrow.value !== null) {
    debugpyComponentMap.value.tryRemoveArrow(props.value.id, arrow.value.id);
    arrow.value = null;
  }
}

function tryAddArrow() {
  if (elementRef.value === null) {
    tryRemoveArrow();
    return;
  }
  const target = debugpyComponentMap.value.getComponent(props.value.id);
  if (target === null) {
    tryRemoveArrow();
    return;
  }
  if (arrow.value !== null) {
    tryRemoveArrow();
  }
  const source = elementRef.value!;
  arrow.value = debugpyComponentMap.value.createArrow(source, props.value.id);
}

function highlightArrows() {
  debugpyComponentMap.value.highlightValue(props.value.id);
}

function unhighlightArrows() {
  debugpyComponentMap.value.unhighlightValue(props.value.id);
}

const elementRef: ShallowRef<HTMLDivElement | null> = shallowRef(null);
const arrow: ShallowRef<LeaderLineWithId | null> = shallowRef(null);

watch(debugpyComponentMap, () => {
  tryAddArrow();
});
onMounted(() => {
  tryAddArrow();
});
onUpdated(() => {
  tryAddArrow();
});
onBeforeUnmount(() => {
  tryRemoveArrow();
});
</script>

<template>
  <div
    class="value-ref"
    :ref="(el: any) => elementRef = el"
    @mouseenter.stop="highlightArrows"
    @mouseleave.stop="unhighlightArrows"
  ></div>
</template>

<style scoped lang="scss">
.value-ref {
  display: flex;
  height: 100%;
  min-height: 1.5em;
}
</style>
