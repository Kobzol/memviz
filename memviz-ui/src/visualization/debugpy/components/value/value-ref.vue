<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  ShallowRef,
  watch,
} from "vue";
import { debugpyComponentMap, valueState } from "../../store";
import { LeaderLineWithId } from "../../component-map";
import { PythonId } from "process-def/debugpy";

const props = defineProps<{
  id: PythonId;
}>();

const pythonValue = computed(() => {
  return valueState.value.getValueOrThrow(props.id);
});

const displayOnHeapText = computed(() => {
  const typeLabel = pythonValue.value.get_type_label();
  if (!typeLabel) {
    return "value displayed on heap";
  }
  return `value of type ${typeLabel} displayed on heap`;
});

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

  if (arrow.value !== null && currentArrowTargetId.value === props.id) {
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
onBeforeUnmount(() => {
  tryRemoveArrow();
});
</script>

<template>
  <div
    class="value-ref-wrapper"
    :ref="(el: any) => (elementRef = el)"
    @mouseenter.stop="highlightArrows"
    @mouseleave.stop="unhighlightArrows"
  >
    <div class="value-ref">
      <span class="heap-note">
        {{ displayOnHeapText }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.value-ref-wrapper {
  position: relative;
  max-width: 100%;
  max-height: 100%;
  height: stretch;
  align-content: center;
}

.value-ref {
  display: flex;
  padding: 5px;
}

.heap-note {
  color: #5f5f5f;
  font-size: 0.9em;
  background: #ffffff;
}
</style>
