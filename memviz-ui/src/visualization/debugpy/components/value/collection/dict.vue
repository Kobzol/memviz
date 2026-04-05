<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { processResolver } from "../../../../store";
import { PythonId } from "process-def/debugpy";
import MemorySlot from "../../memory-slot.vue";
import { componentState, objectVisibilityState, valueState } from "../../../store";
import { LazyDictVal } from "../../../type/lazy-value";
import { isDict } from "../../../utils/types";
import { assert } from "../../../../../utils";
import { RichKeyValuePair } from "../../../type/type";
import {
  COLLECTION_ITEM_DISPLAY_COUNT_DEFAULT,
  COLLECTION_ITEM_DISPLAY_COUNT_MAX,
  COLLECTION_ITEM_DISPLAY_COUNT_MIN,
} from "../../../value-display-settings";

const props = defineProps<{
  id: PythonId;
}>();

const currentIndex = ref(0);
const visibleElementCount = ref(COLLECTION_ITEM_DISPLAY_COUNT_DEFAULT);
const visiblePairs = ref<RichKeyValuePair[]>([]);
const isOpen = ref(false);

function clampVisibleElementCount(count: number): number {
  return Math.max(
    COLLECTION_ITEM_DISPLAY_COUNT_MIN,
    Math.min(COLLECTION_ITEM_DISPLAY_COUNT_MAX, count),
  );
}

const pythonValue = computed(() => {
  const val = valueState.value.getValueOrThrow(props.id);
  assert(isDict(val), `Value with id ${props.id} is not a LazyDictVal`);
  return val as LazyDictVal;
});

const totalElementCount = computed(() => pythonValue.value.pair_count);
const canGoToPrevious = computed(() => currentIndex.value > 0);
const canGoToNext = computed(
  () => currentIndex.value + visibleElementCount.value < totalElementCount.value,
);
const isFirstViewResolved = computed(() =>
  pythonValue.value.areItemsFetched(0, visibleElementCount.value),
);

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

function restoreDictState() {
  const savedState = componentState.getState(props.id, pythonValue.value.kind);
  currentIndex.value = clampCurrentIndex(savedState?.collectionPageIndex ?? 0);
  visibleElementCount.value = clampVisibleElementCount(
    savedState?.collectionItemCount ?? COLLECTION_ITEM_DISPLAY_COUNT_DEFAULT,
  );
  setStateToOpen(savedState ? savedState.isOpen : isFirstViewResolved.value);
  visiblePairs.value = [];
}

async function loadData() {
  const resolver = processResolver.value;
  if (!resolver || !isOpen.value) {
    return;
  }

  const count = Math.min(
    visibleElementCount.value,
    totalElementCount.value - currentIndex.value,
  );

  if (count <= 0) {
    visiblePairs.value = [];
    return;
  }

  visiblePairs.value = await pythonValue.value.getElements(
    resolver.debugpy,
    currentIndex.value,
    count,
  );
}

watch(
  [() => pythonValue.value, () => processResolver.value],
  () => {
    restoreDictState();
    if (isOpen.value) {
      void loadData();
    }
  },
  { immediate: true },
);

const goToPrevious = () => {
  if (!canGoToPrevious.value) {
    return;
  }

  currentIndex.value--;
  saveState();
  void loadData();
};

const goToNext = () => {
  if (!canGoToNext.value) {
    return;
  }

  currentIndex.value++;
  saveState();
  void loadData();
};

const handleIndexInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const newIndex = parseInt(target.value, 10);
  if (Number.isNaN(newIndex)) {
    return;
  }

  currentIndex.value = clampCurrentIndex(newIndex);
  saveState();
  void loadData();
};

const handleVisibleCountInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const newCount = parseInt(target.value, 10);
  if (Number.isNaN(newCount)) {
    return;
  }

  visibleElementCount.value = clampVisibleElementCount(newCount);
  saveState();
  void loadData();
};

function onClick() {
  setStateToOpen(true);
  saveState();
  void loadData();
}

function closeView() {
  setStateToOpen(false);
  saveState();
}
</script>

<template>
  <div v-if="pythonValue.pair_count > 0" class="dict">
    <div v-if="isOpen" class="collection-frame">
      <div class="control-bar top">
        <div class="control-wrapper">
          <button class="nav-btn" @click="goToPrevious" :disabled="!canGoToPrevious">
            &#9650
          </button>
          <span class="field-label">idx:</span>
          <input class="index-input" type="number" :value="currentIndex" @input="handleIndexInput" :min="0"
            :max="totalElementCount - 1" />
          <span class="field-label">count:</span>
          <input class="count-input" type="number" :value="visibleElementCount" @input="handleVisibleCountInput"
            :min="COLLECTION_ITEM_DISPLAY_COUNT_MIN" :max="COLLECTION_ITEM_DISPLAY_COUNT_MAX" />
          <button class="close-btn" @click.stop="closeView">×</button>

        </div>
      </div>

      <div class="content-area">
        <div v-if="visiblePairs.length > 0" class="pairs">
          <div v-for="(pair, index) in visiblePairs" :key="index" class="pair-row" :style="`view-transition-name: pair-row-${index + currentIndex};`">
            <div class="key-cell" :data-index="index + currentIndex">
              <MemorySlot :id="pair.key.id" />
            </div>

            <MemorySlot :id="pair.value.id" />
          </div>
        </div>
        <div v-else class="loading">Loading...</div>
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
.dict {
  display: flex;
  justify-content: start;
  flex-direction: column;

  .not-resolved {
    &:hover {
      cursor: pointer;
    }
  }

  .loading {
    padding: 6px 8px;
    color: #555;
    font-style: italic;
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

  &>* {
    align-content: center;
  }

  & * {
    box-sizing: border-box;
  }

  & input {
    padding-inline: 5px;
    line-height: 1;
    text-align: center;
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
  aspect-ratio: 1/1;
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

.pairs {
  .pair-row {
    display: grid;
    grid-template-columns: 1fr 1fr;

    &:not(:last-child) {
      border-bottom: 1px solid #858585;
    }

    & > div {
      position: relative;
      padding: 5px;

      &:first-child::after {
        content: "";
        display: block;
        position: absolute;
        inset-block: 0;
        width: 1px;
        right: -0.5px;
        background: #858585;
      }
    }
  }

  .key-cell {
    background-color: #dae4ef;
    position: relative;
    display: flex;
    flex-direction: row;

    &::after {
      content: attr(data-index);
      position: absolute;
      top: 5px;
      right: 5px;
    }
  }
}
</style>
