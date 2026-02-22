<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  onUpdated,
  shallowRef,
  ShallowRef,
  watch,
} from "vue";
import { debugpyComponentMap } from "../../store";
import { LeaderLineWithId } from "../../component-map";
import { PythonId } from "process-def/debugpy";

const props = defineProps<{
  id: PythonId;
}>();
const currentArrowTargetId = shallowRef<PythonId | null>(null);
function tryRemoveArrow() {
  if (arrow.value !== null && currentArrowTargetId.value !== null) {
    debugpyComponentMap.value.tryRemoveArrow(
      currentArrowTargetId.value,
      arrow.value.id,
    );
    arrow.value = null;
    currentArrowTargetId.value = null;
  }
}

function tryAddArrow() {
  if (!props.id) return;

  if (elementRef.value === null) {
    tryRemoveArrow();
    return;
  }

  if (arrow.value !== null) {
    tryRemoveArrow();
  }

  const target = debugpyComponentMap.value.getComponent(props.id);
  if (target === null) {
    tryRemoveArrow();
    return;
  }

  const source = elementRef.value!;
  arrow.value = debugpyComponentMap.value.createArrow(source, props.id);
  currentArrowTargetId.value = props.id;
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
watch(
  () => props.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      tryRemoveArrow();
      tryAddArrow();
    }
  },
);
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
