<script setup lang="ts">
import { computed, ref } from "vue";
import SequenceCollection from "./sequence-collection.vue";
import SetCollection from "./set-collection.vue";
import {
  ValueKind,
} from "process-def/debugpy";
import { LazyFlatCollectionVal, LazyFrozenSetVal, LazyListVal, LazySetVal, LazyTupleVal } from "../../../type/lazy-value";
import { valueState } from "../../../store";
import { assert } from "../../../../../utils";
import { isFlatCollection, isTuple } from "../../../utils/types";

const props = defineProps<{
  id: string;
}>();

const currentIndex = ref(0);
const isLoaded = ref(false);
const visibleElementCount = 5;

const totalElementCount = computed(() => pythonValue.value.element_count);
const canGoToPrevious = computed(() => currentIndex.value > 0);
const canGoToNext = computed(
  () => currentIndex.value + visibleElementCount < totalElementCount.value
);
const pythonValue = computed(() => {
  let val = valueState.value.getValueOrThrow(props.id);
  assert(
    isFlatCollection(val),
    `Value with id ${props.id} is not a LazyFlatCollectionVal`,
  );
  return val as LazyFlatCollectionVal;
});

const goToPrevious = () => {
  if (canGoToPrevious.value) currentIndex.value--;
};

const goToNext = () => {
  if (canGoToNext.value) currentIndex.value++;
};

const handleIndexInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  let newIndex = parseInt(target.value, 10);
  if (isNaN(newIndex)) return;
  if (newIndex < 0) newIndex = 0;
  if (newIndex >= totalElementCount.value) newIndex = totalElementCount.value - 1;
  currentIndex.value = newIndex;
};

function onClick() {
  isLoaded.value = true;
}

function isSequenceCollection(
  value: LazyFlatCollectionVal
): value is LazyListVal | LazyTupleVal {
  return value.kind === ValueKind.LIST || value.kind === ValueKind.TUPLE;
}

function isSetCollection(
  value: LazyFlatCollectionVal
): value is LazySetVal | LazyFrozenSetVal {
  return value.kind === ValueKind.SET || value.kind === ValueKind.FROZENSET;
}
</script>

<template>
  <div v-if="pythonValue.element_count > 0" class="collection-wrapper">
    <div v-if="isLoaded" class="collection-frame">
      <div class="control-bar top">
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
            :max="totalElementCount - 1"
          />
        </div>
      </div>
      <div class="content-area">
        <SequenceCollection
          v-if="isSequenceCollection(pythonValue)"
          :id="props.id"
          :start-index="currentIndex"
          :visibleElementCount="visibleElementCount"
        />
        <SetCollection
          v-else-if="isSetCollection(pythonValue)"
          :id="props.id"
          :start-index="currentIndex"
          :visibleElementCount="visibleElementCount"
        />
        <div v-else class="error">Unsupported: {{ pythonValue.kind }}</div>
      </div>

      <div class="control-bar bottom">
        <button class="nav-btn" @click="goToNext" :disabled="!canGoToNext">
          &#9660
        </button>
      </div>
      
    </div>

    <div v-else @click="onClick" class="not-resolved">
      <code> ... </code>
    </div>
  </div>
</template>

<style scoped lang="scss">
.collection-wrapper {
  display: flex;
  justify-content: start;
  flex-direction: column;

  .not-resolved {
    &:hover {
      cursor: pointer;
    }
  }
}

.collection-frame {
  border: 3px solid black;
  margin: 5px 5px 0 0;
  width: 100%;
  background: white;
}

.control-bar {
  background: #f4f4f4;
  display: flex;
  
  &.top { border-bottom: 1px solid #858585; }
  &.bottom { border-top: 1px solid #858585; }
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
  padding: 2px 0;

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

.content-area {
  width: 100%;
}
.error {
  padding: 5px;
  color: red;
}
</style>