<script setup lang="ts">
import { computed, ref, watch } from "vue";
import SequenceCollection from "./sequence-collection.vue";
import SetCollection from "./set-collection.vue";
import {
  ValueKind,
} from "process-def/debugpy";
import { LazyFlatCollectionVal, LazyFrozenSetVal, LazyListVal, LazySetVal, LazyTupleVal } from "../../../type/lazy-value";
import { valueState } from "../../../store";
import { assert } from "../../../../../utils";
import { isFlatCollection } from "../../../utils/types";
import {
  COLLECTION_ITEM_DISPLAY_COUNT_DEFAULT,
  COLLECTION_ITEM_DISPLAY_COUNT_MAX,
  COLLECTION_ITEM_DISPLAY_COUNT_MIN,
} from "../../../value-display-settings";

const props = defineProps<{
  id: string;
}>();

const currentIndex = ref(0);
const visibleElementCount = ref(COLLECTION_ITEM_DISPLAY_COUNT_DEFAULT);

function clampVisibleElementCount(count: number): number {
  return Math.max(
    COLLECTION_ITEM_DISPLAY_COUNT_MIN,
    Math.min(COLLECTION_ITEM_DISPLAY_COUNT_MAX, count),
  );
}

const pythonValue = computed(() => {
  let val = valueState.value.getValueOrThrow(props.id);
  assert(
    isFlatCollection(val),
    `Value with id ${props.id} is not a LazyFlatCollectionVal`,
  );
  return val as LazyFlatCollectionVal;
});
const isFirstViewResolved = computed(() => {
  return pythonValue.value.areItemsFetched(0, visibleElementCount.value);
});
const hasLoaded = ref(isFirstViewResolved.value);
const isOpen = ref(isFirstViewResolved.value);

const totalElementCount = computed(() => pythonValue.value.element_count);
const canGoToPrevious = computed(() => currentIndex.value > 0);
const canGoToNext = computed(
  () => currentIndex.value + visibleElementCount.value < totalElementCount.value
);


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

const handleVisibleCountInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  let nextCount = parseInt(target.value, 10);
  if (isNaN(nextCount)) return;
  nextCount = clampVisibleElementCount(nextCount);
  visibleElementCount.value = nextCount;
};

function onClick() {
  isOpen.value = true;
  hasLoaded.value = true;
}

function closeView() {
  isOpen.value = false;
}

watch(
  () => props.id,
  () => {
    currentIndex.value = 0;
    hasLoaded.value = isFirstViewResolved.value;
    isOpen.value = isFirstViewResolved.value;
  },
);

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
    <div v-if="hasLoaded && isOpen" class="collection-frame">
      <div class="control-bar top">
        <div class="control-wrapper">
          <button
            class="nav-btn"
            @click="goToPrevious"
            :disabled="!canGoToPrevious"
          >
            &#9650
          </button>
          <div class="field-group">
            <span class="field-label">idx</span>
            <input
              class="index-input"
              type="number"
              :value="currentIndex"
              @input="handleIndexInput"
              :min="0"
              :max="totalElementCount - 1"
            />
          </div>
          <div class="field-group">
            <span class="field-label">count</span>
            <input
              class="count-input"
              type="number"
              :value="visibleElementCount"
              @input="handleVisibleCountInput"
              :min="COLLECTION_ITEM_DISPLAY_COUNT_MIN"
              :max="COLLECTION_ITEM_DISPLAY_COUNT_MAX"
            />
          </div>
          <button class="close-btn" @click.stop="closeView">×</button>
        </div>
      </div>
      <div class="content-area">
        <SequenceCollection
          v-if="isSequenceCollection(pythonValue)"
          :id="props.id"
          :start-index="currentIndex"
          :visible-element-count="visibleElementCount"
        />
        <SetCollection
          v-else-if="isSetCollection(pythonValue)"
          :id="props.id"
          :start-index="currentIndex"
          :visible-element-count="visibleElementCount"
        />
        <div v-else class="error">Unsupported: {{ pythonValue.kind }}</div>
      </div>

      <div class="control-bar bottom">
        <button class="nav-btn" @click="goToNext" :disabled="!canGoToNext">
          &#9660
        </button>
      </div>
      
    </div>

    <div v-if="!isOpen" @click="onClick" class="not-resolved">
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
  min-height: 20px;
  
  &.top { border-bottom: 1px solid #858585; }
  &.bottom { border-top: 1px solid #858585; }
}

.control-wrapper {
  display: flex;
  align-items: stretch;
  width: 100%;
}

.field-group {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-left: 1px solid #858585;
  background: white;
  padding: 1px 4px;
}

.field-label {
  font-size: 0.72em;
  line-height: 1;
  color: #3f3f3f;
  text-align: center;
  padding: 0;
}

.close-btn {
  border: none;
  border-left: 1px solid #858585;
  background: transparent;
  cursor: pointer;
  width: 22px;
  padding: 0;
  line-height: 1;

  &:hover {
    background-color: #e2e2e2;
  }
}

.nav-btn {
  flex-grow: 1;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.95em;
  line-height: 1;
  width: 100%;
  padding: 0;

  &:disabled {
    color: #ccc;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: #e2e2e2;
  }
}

.index-input {
  width: 52px;
  height: 16px;
  border: none;
  text-align: center;
  background: white;
  font-size: 0.85em;
}

.count-input {
  width: 52px;
  height: 16px;
  border: none;
  text-align: center;
  background: white;
  font-size: 0.85em;
}

.content-area {
  width: 100%;
}
.error {
  padding: 5px;
  color: red;
}
</style>