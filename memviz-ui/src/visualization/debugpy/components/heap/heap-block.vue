<script setup lang="ts">
import type { PythonId } from "process-def/debugpy";
import {
  onBeforeUnmount,
  onMounted,
  onUpdated,
  shallowRef,
  ShallowRef,
  watch,
} from "vue";
import ValueComponent from "../value/value.vue";
import { debugpyComponentMap } from "../../store";
import { assert } from "../../../../utils";
import { ComponentUnsubscribeFn } from "../../component-map";

const props = defineProps<{
  id: PythonId;
}>();

async function updateComponentInMap() {
  assert(elementRef.value !== null, "component has not been mounted yet");

  // This is required to wait for browser relayout, to make sure
  // that the element has the final layout before it is registered
  window.requestAnimationFrame(() => {
    removeComponentFromMap();

    if (elementRef.value !== null) {
      unsubscribeFn.value = debugpyComponentMap.value.addComponent(
        {
          id: props.id,
          element: elementRef.value,
        },
        debugpyComponentMap,
      );
    }
  });
}

function removeComponentFromMap() {
  if (unsubscribeFn.value !== null) {
    unsubscribeFn.value();
    unsubscribeFn.value = null;
  }
}

function highlightArrows() {
  debugpyComponentMap.value.highlightValue(props.id);
}
function unhighlightArrows() {
  debugpyComponentMap.value.unhighlightValue(props.id);
}
const elementRef = shallowRef<HTMLElement | null>(null);
const unsubscribeFn: ShallowRef<ComponentUnsubscribeFn | null> =
  shallowRef(null);

onMounted(() => updateComponentInMap());
onUpdated(() => updateComponentInMap());
onBeforeUnmount(() => removeComponentFromMap());
watch(
  () => props.id,
  () => updateComponentInMap(),
);
</script>

<template>
  <div
    class="heap-block"
    :ref="(el: any) => (elementRef = el)"
    @mouseenter.stop="highlightArrows"
    @mouseleave.stop="unhighlightArrows"
  >
    <ValueComponent :id="props.id" />
  </div>
</template>

<style scoped lang="scss">
.heap-block {
  flex: 3;
  min-width: 0;
  word-wrap: break-word;
  background: #ffffff;
  border-top: solid 1px #000000;
  padding: 5px;
  gap: 6px;
}
</style>
