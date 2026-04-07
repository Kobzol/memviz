<script setup lang="ts">
import type { PythonId } from "process-def/debugpy";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  shallowRef,
  ShallowRef,
  watch,
} from "vue";
import ValueComponent from "../value/value.vue";
import { debugpyComponentMap, highlightedId } from "../../store";
import { assert } from "../../../../utils";
import { ComponentUnsubscribeFn } from "../../component-map";

const props = defineProps<{
  id: PythonId;
}>();

const isHighlighted = computed(() => highlightedId.value === props.id);

async function updateComponentInMap() {
  assert(elementRef.value !== null, "component has not been mounted yet");

  window.requestAnimationFrame(() => {
    const currentComponent = debugpyComponentMap.value.getComponent(props.id);
    if (currentComponent?.element === elementRef.value) {
      return;
    }

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
    :class="{ highlight: isHighlighted }"
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
  padding: 5px;
  gap: 6px;

  box-sizing: border-box;
  border: 1px solid #5f5f5f;
  border-top: none;
}

.highlight {
  backface-visibility: hidden;
  animation: ripple-out-large 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes ripple-out-large {
  0% {
    box-shadow:
      0 0 0 0 rgba(255, 121, 73, 0),
      0 0 0 0 rgba(255, 121, 73, 0);
  }

  20% {
    box-shadow:
      0 0 0 6px rgba(255, 121, 73, 0.8),
      0 0 20px 6px rgba(255, 121, 73, 0.4);
  }

  100% {
    box-shadow:
      0 0 0 12px rgba(255, 121, 73, 0),
      0 0 50px 35px rgba(255, 121, 73, 0);
  }
}
</style>
