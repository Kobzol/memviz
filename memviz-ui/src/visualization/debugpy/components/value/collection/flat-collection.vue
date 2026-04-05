<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ValueKind } from "process-def/debugpy";
import SequenceCollection from "./sequence-collection.vue";
import SetCollection from "./set-collection.vue";
import {
  LazyFlatCollectionVal,
  LazyFrozenSetVal,
  LazyListVal,
  LazySetVal,
  LazyTupleVal,
} from "../../../type/lazy-value";
import {
  componentState,
  objectVisibilityState,
  valueState,
} from "../../../store";
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

const pythonValue = computed(() => {
  const val = valueState.value.getValueOrThrow(props.id);
  assert(
    isFlatCollection(val),
    `Value with id ${props.id} is not a LazyFlatCollectionVal`,
  );
  return val as LazyFlatCollectionVal;
});

const totalElementCount = computed(() => pythonValue.value.element_count);
const isFirstViewResolved = computed(() =>
  pythonValue.value.areItemsFetched(0, visibleElementCount.value),
);
const isOpen = ref(isFirstViewResolved.value);
const canGoToPrevious = computed(() => currentIndex.value > 0);
const canGoToNext = computed(
  () => currentIndex.value + visibleElementCount.value < totalElementCount.value,
);

function clampVisibleElementCount(count: number): number {
  return Math.max(
    COLLECTION_ITEM_DISPLAY_COUNT_MIN,
    Math.min(COLLECTION_ITEM_DISPLAY_COUNT_MAX, count),
  );
}

function clampCurrentIndex(index: number): number {
  return Math.max(0, Math.min(index, Math.max(totalElementCount.value - 1, 0)));
}

function saveState() {
  componentState.setState(props.id, {
    kind: pythonValue.value.kind,
    isOpen: isOpen.value,
    collectionPageIndex: currentIndex.value,
    collectionItemCount: visibleElementCount.value,
  });
}

function setStateToOpen(value: boolean) {
  isOpen.value = value;
  objectVisibilityState.setSourceObjectAsCollapsed(props.id, !value);
}

function restoreCollectionState() {
  const savedValue = componentState.getState(props.id, pythonValue.value.kind);
  currentIndex.value = clampCurrentIndex(savedValue?.collectionPageIndex ?? 0);
  visibleElementCount.value = clampVisibleElementCount(
    savedValue?.collectionItemCount ?? COLLECTION_ITEM_DISPLAY_COUNT_DEFAULT,
  );
  setStateToOpen(savedValue ? savedValue.isOpen : isFirstViewResolved.value);
}

watch(
  () => pythonValue.value,
  () => {
    restoreCollectionState();
  },
  { immediate: true },
);

const goToPrevious = () => {
  if (!canGoToPrevious.value) {
    return;
  }

  currentIndex.value--;
  saveState();
};

const goToNext = () => {
  if (!canGoToNext.value) {
    return;
  }

  currentIndex.value++;
  saveState();
};

const handleIndexInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const newIndex = parseInt(target.value, 10);
  if (Number.isNaN(newIndex)) {
    return;
  }

  currentIndex.value = clampCurrentIndex(newIndex);
  saveState();
};

const handleVisibleCountInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const newCount = parseInt(target.value, 10);
  if (Number.isNaN(newCount)) {
    return;
  }

  visibleElementCount.value = clampVisibleElementCount(newCount);
  saveState();
};

function onClick() {
  setStateToOpen(true);
  saveState();
}

function closeView() {
  setStateToOpen(false);
  saveState();
}

function isSequenceCollection(
  value: LazyFlatCollectionVal,
): value is LazyListVal | LazyTupleVal {
  return value.kind === ValueKind.LIST || value.kind === ValueKind.TUPLE;
}

function isSetCollection(
  value: LazyFlatCollectionVal,
): value is LazySetVal | LazyFrozenSetVal {
  return value.kind === ValueKind.SET || value.kind === ValueKind.FROZENSET;
}
</script>

<template>
  <div v-if="pythonValue.element_count > 0" class="collection-wrapper">
    <div v-if="isOpen" class="collection-frame">
      <div class="control-bar top">
        <div class="control-wrapper">
          <button
            class="nav-btn"
            @click="goToPrevious"
            :disabled="!canGoToPrevious"
          >
            &#9650
          </button>
          <span class="field-label">idx</span>
          <input
            class="index-input"
            type="number"
            :value="currentIndex"
            @input="handleIndexInput"
            :min="0"
            :max="totalElementCount - 1"
          />
          <span class="field-label">count</span>
          <input
            class="count-input"
            type="number"
            :value="visibleElementCount"
            @input="handleVisibleCountInput"
            :min="COLLECTION_ITEM_DISPLAY_COUNT_MIN"
            :max="COLLECTION_ITEM_DISPLAY_COUNT_MAX"
          />
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
  border: 2px solid black;
  margin-block-start: 5px;
  background: white;
}

.control-bar {
  background: #f4f4f4;
  display: flex;
  min-height: 20px;

  &.top {
    border-bottom: 1px solid #858585;
  }

  &.bottom {
    border-top: 1px solid #858585;
  }
}

.control-wrapper {
  display: flex;
  width: 100%;

  & > * {
    align-content: center;
  }

  & * {
    box-sizing: border-box;
  }
}

.field-label {
  font-size: 0.72em;
  line-height: 1;
  color: #3f3f3f;
  background: white;
  text-align: right;
  padding-inline: 5px;
  border-left: 1px solid #858585;
}

.close-btn {
  border: none;
  border-left: 1px solid #858585;
  background: transparent;
  cursor: pointer;
  height: stretch;
  aspect-ratio: 1 / 1;
  padding: 0;

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
  border: none;
  background: white;
  font-size: 0.85em;
}

.count-input {
  border: none;
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
