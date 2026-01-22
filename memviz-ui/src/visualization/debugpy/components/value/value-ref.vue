<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  onUpdated,
  shallowRef,
  ShallowRef,
  watch,
} from "vue";
import { debugpyComponentMap } from "../../../store";
import { LeaderLineWithId } from "../../component-map";
import { PythonId } from "process-def/debugpy";

const props = defineProps<{
  id: PythonId;
}>();

function tryRemoveArrow() {
  if (arrow.value !== null) {
    debugpyComponentMap.value.tryRemoveArrow(props.id, arrow.value.id);
    arrow.value = null;
  }
}

function tryAddArrow() {
  if (elementRef.value === null) {
    tryRemoveArrow();
    return;
  }
  const target = debugpyComponentMap.value.getComponent(props.id);
  if (target === null) {
    tryRemoveArrow();
    return;
  }
  if (arrow.value !== null) {
    tryRemoveArrow();
  }
  const source = elementRef.value!;
  arrow.value = debugpyComponentMap.value.createArrow(source, props.id);
}

function highlightArrows() {
  debugpyComponentMap.value.highlightValue(props.id);
}

function unhighlightArrows() {
  debugpyComponentMap.value.unhighlightValue(props.id);
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
    :ref="(el: any) => (elementRef = el)"
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
