<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import { processResolver } from "../../../../store";
import { PythonId } from "process-def/debugpy";
import MemorySlot from "../../memory-slot.vue";
import { valueState } from "../../../store";
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

const isFirstViewResolved = computed(() => {
  return pythonValue.value.areItemsFetched(0, visibleElementCount.value);
});
const hasLoaded = ref(isFirstViewResolved.value);
const isOpen = ref(isFirstViewResolved.value);

const totalElementCount = computed(() => pythonValue.value.pair_count);
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

async function loadData() {
  const resolver = processResolver.value;
  if (!resolver) return;

  const count = Math.min(
    visibleElementCount.value,
    totalElementCount.value - currentIndex.value,
  );

  visiblePairs.value = await pythonValue.value.getElements(
    resolver.debugpy,
    currentIndex.value,
    count,
  );
}

async function onClick() {
  isOpen.value = true;
  if (!hasLoaded.value) {
    await loadData();
    hasLoaded.value = true;
  }
}

function closeView() {
  isOpen.value = false;
}

watch([currentIndex, visibleElementCount], loadData);

watch(
  () => props.id,
  () => {
    currentIndex.value = 0;
    visiblePairs.value = [];
    hasLoaded.value = isFirstViewResolved.value;
    isOpen.value = isFirstViewResolved.value;
  },
);

onMounted(() => {
  if (isOpen.value) {
    loadData();
    hasLoaded.value = true;
  }
});
</script>

<template>
  <div v-if="pythonValue.pair_count > 0" class="dict">
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
        <div class="pairs">
          <table>
            <tr v-for="(pair, index) in visiblePairs" :key="index">
              <td class="key-cell">
                <div class="key-container">
                  <div class="key">
                    <MemorySlot :id="pair.key.id" />
                  </div>
                  <div class="index">{{ index + currentIndex }}</div>
                </div>
              </td>
              <td>
                <div class="value">
                  <MemorySlot :id="pair.value.id" />
                </div>
              </td>
            </tr>
          </table>
        </div>
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

  &.top {
    border-bottom: 1px solid #858585;
  }
  &.bottom {
    border-top: 1px solid #858585;
  }
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

.pairs {
  display: flex;
  justify-content: start;
  flex-direction: column;

  table {
    border-collapse: collapse;
    width: 100%;
    border: none;

    td {
      border: 1px solid #858585;
      
      &:first-child { border-left: none; }
      &:last-child { border-right: none; }
    }
    tr:first-child td { border-top: none; }
    tr:last-child td { border-bottom: none; }
  }

  .value {
    padding-left: 5px;
  }

  .key-cell {
    background-color: #dae4ef;
    width: 50%;
  }

  .key-container {
    display: flex;
    flex-direction: row;
    padding-left: 5px;

    .key {
      flex: 1;
    }

    .index {
      flex: none;
      font-size: 0.9em;
      color: #3f3f3f;
      text-align: right;
      padding-right: 5px;
    }
  }
}
</style>