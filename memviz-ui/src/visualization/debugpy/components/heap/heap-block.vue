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
import ValueComponent from "../value/value.vue";
import { debugpyComponentMap } from "../../../store";
import { assert } from "../../../../utils";
import { ComponentUnsubscribeFn } from "../../component-map";

const props = defineProps({
  value: {
    type: Object as PropType<Value>,
    required: true,
  },
});

async function updateComponentInMap() {
  assert(elementRef.value !== null, "component has not been mounted yet");

  // This is required to wait for browser relayout, to make sure
  // that the element has the final layout before it is registered
  window.requestAnimationFrame(() => {
    removeComponentFromMap();

    if (elementRef.value !== null) {
      unsubscribeFn.value = debugpyComponentMap.value.addComponent(
        {
          id: props.value.id,
          element: elementRef.value,
        },
        debugpyComponentMap
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
  debugpyComponentMap.value.highlightValue(props.value.id);
}
function unhighlightArrows() {
  debugpyComponentMap.value.unhighlightValue(props.value.id);
}
const elementRef = shallowRef<HTMLElement | null>(null);
const unsubscribeFn: ShallowRef<ComponentUnsubscribeFn | null> =
  shallowRef(null);

onMounted(() => updateComponentInMap());
onUpdated(() => updateComponentInMap());
onBeforeUnmount(() => removeComponentFromMap());
watch(
  () => props.value,
  () => updateComponentInMap()
);
</script>

<template>
  <div
    class="heap-block"
    :ref="(el: any) => elementRef = el"
    @mouseenter.stop="highlightArrows"
    @mouseleave.stop="unhighlightArrows"
  >
    <ValueComponent :value="value" />
  </div>
</template>

<style scoped lang="scss">
.heap-block {
  flex: 3;
  min-width: 0;
  word-break: break-all;
  background: #ffffff;
  border-top: solid 1px #000000;
  padding: 5px;
  gap: 6px;
}
</style>
