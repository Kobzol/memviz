<script setup lang="ts">
import { ref, computed } from "vue";
import { DeferredListVal, DeferredTupleVal, Value } from "process-def/debugpy";
import MemorySlot from "../../memory-slot.vue";

const props = defineProps<{
  value: DeferredListVal | DeferredTupleVal;
}>();

const handleIndexInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  let newIndex = parseInt(target.value, 10);
  if (isNaN(newIndex)) return;
  if (newIndex < 0) newIndex = 0;
  if (newIndex >= totalElements.value) newIndex = totalElements.value - 1;
  currentIndex.value = newIndex;
};
const currentIndex = ref(0);
const visibleElementCount = 5;

const totalElements = computed(() => props.value.element_count);
const canGoToPrevious = computed(() => currentIndex.value > 0);
const canGoToNext = computed(
  () => currentIndex.value + visibleElementCount < totalElements.value
);

const goToPrevious = () => {
  if (canGoToPrevious.value) currentIndex.value--;
};

const goToNext = () => {
  if (canGoToNext.value) currentIndex.value++;
};

const visibleElements = computed(() => {
  const elements: { [key: number]: Value } = {};
  const lastIndex = Math.min(
    currentIndex.value + visibleElementCount,
    totalElements.value
  );
  for (let i = currentIndex.value; i < lastIndex; i++) {
    elements[i] = props.value.elements[i];
  }
  return elements;
});
</script>

<template>
  <div class="sequence">
    <table class="elements">
      <tr class="control-row">
        <td colspan="2">
          <div class="control-wrapper">
            <button
              class="nav-btn"
              @click="goToPrevious"
              :disabled="!canGoToPrevious"
            >
              &#9650
            </button>
            <input
              class="index-input"
              type="number"
              :value="currentIndex"
              @input="handleIndexInput"
              :min="0"
              :max="totalElements - 1"
            />
          </div>
        </td>
      </tr>

      <tr v-for="(el, index) in visibleElements" :key="index">
        <td class="index">{{ index }}</td>
        <td class="value">
          <MemorySlot :value="el" />
        </td>
      </tr>

      <tr class="control-row">
        <td colspan="2">
          <button class="nav-btn" @click="goToNext" :disabled="!canGoToNext">
            &#9660
          </button>
        </td>
      </tr>
    </table>
  </div>
</template>

<style scoped lang="scss">
td {
  border: 1px solid #858585;
}
.sequence {
  display: flex;
  justify-content: start;
  flex-direction: column;
}
.elements {
  border-collapse: collapse;
  border: 3px solid black;

  margin: 5px 5px 0 0;
  width: 100%;

  .index {
    background-color: #dae4ef;
    line-height: 1;
    text-align: center;
    font-size: 1.2em;
    width: 15%;
  }
}

.control-row td {
  padding: 0;
  background: #f4f4f4;
}

.control-wrapper {
  display: flex;
  align-items: stretch;
  width: 100%;
}

.nav-btn {
  flex-grow: 1;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1.1em;
  width: 100%;

  &:disabled {
    color: #ccc;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: #e2e2e2;
  }
}

.index-input {
  width: 60px;
  border: none;
  border-left: 1px solid #858585;
  text-align: center;
  background: white;
}

.value {
  padding-left: 5px;
}
</style>
