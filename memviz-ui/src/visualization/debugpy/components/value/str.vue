<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { processResolver } from "../../../store";
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import { assert } from "../../../../utils";
import { valueState } from "../../store";
import { isStr } from "../../utils/types";
import { PythonId } from "process-def/debugpy";
import {
  STRING_BATCH_SIZE_DEFAULT,
  STRING_BATCH_SIZE_MAX,
  STRING_BATCH_SIZE_MIN,
} from "../../value-display-settings";

const props = defineProps<{
  id: PythonId;
}>();

const batchSize = ref(STRING_BATCH_SIZE_DEFAULT);

const pythonValue = computed(() => {
  const val = valueState.value.getValueOrThrow(props.id);
  assert(isStr(val), `Value with id ${props.id} is not a LazyStrVal`);
  return val;
});

const resolvedContent = ref("");
const resolvedContentLength = ref(0);
const visibleLimit = ref(0);
const isFetching = ref(false);

function clampBatchSize(count: number): number {
  return Math.max(
    STRING_BATCH_SIZE_MIN,
    Math.min(STRING_BATCH_SIZE_MAX, count),
  );
}

function getLength(text: string): number {
  return Array.from(text).length;
}

watch(
  () => props.id,
  () => {
    resolvedContent.value = "";
    resolvedContentLength.value = 0;
    isFetching.value = false;

    visibleLimit.value = Math.min(batchSize.value, pythonValue.value.length);
  },
  { immediate: true },
);

function handleBatchSizeInput(event: Event) {
  const target = event.target as HTMLInputElement;
  let nextCount = parseInt(target.value, 10);
  if (isNaN(nextCount)) return;
  nextCount = clampBatchSize(nextCount);
  batchSize.value = nextCount;
}

async function fetchMissingContent() {
  const val = pythonValue.value;
  if (!val || isFetching.value) return;

  const targetLimit = visibleLimit.value;
  const currentLength = resolvedContentLength.value;

  if (currentLength >= targetLimit) return;

  const currentId = props.id;
  isFetching.value = true;

  try {
    const count = targetLimit - currentLength;
    const resStr = await val.getElements(
      processResolver.value.debugpy,
      currentLength,
      count,
    );

    if (props.id !== currentId) return;

    resolvedContent.value += resStr;
    resolvedContentLength.value += getLength(resStr);
  } catch (e) {
    console.error("Failed to fetch string elements", e);
  } finally {
    if (props.id === currentId) {
      isFetching.value = false;
    }
  }
}

watch(
  visibleLimit,
  () => {
    fetchMissingContent();
  },
  { immediate: true },
);

watch(batchSize, () => {
  const minVisible = Math.max(resolvedContentLength.value, batchSize.value);
  visibleLimit.value = Math.min(minVisible, pythonValue.value.length);
});

async function loadMoreData() {
  const val = pythonValue.value;
  const currentLimit = visibleLimit.value;

  if (resolvedContentLength.value < currentLimit) {
    await fetchMissingContent();
    return;
  }

  const nextLimit = currentLimit + batchSize.value;
  const finalLimit = Math.min(nextLimit, val.length);

  if (finalLimit > currentLimit) {
    visibleLimit.value = finalLimit;
  }
}

const escapedContent = computed(() => {
  if (!resolvedContent.value) return "";
  // escape special characters for display
  return JSON.stringify(resolvedContent.value).slice(1, -1);
});

const tooltip = computed(() => {
  if (!pythonValue.value) return "";
  return `Id: <b>${props.id}</b>, size: <b>${pythonValue.value.size} B</b>`;
});

const isLoaded = computed(() => {
  if (!pythonValue.value) return false;
  return resolvedContentLength.value >= pythonValue.value.length;
});
</script>

<template>
  <TooltipContributor :tooltip="tooltip" :key="id">
    <div class="str">
      <code class="string"
        >"{{ escapedContent
        }}<span v-if="!isLoaded" class="not-resolved" @click="loadMoreData"
          >...</span
        >"</code
      >
      <div class="counter-row" v-if="!isLoaded">
        <label class="field-group">
          <span class="field-label">chunk</span>
          <input
            class="counter-input"
            type="number"
            :value="batchSize"
            @input="handleBatchSizeInput"
            :min="STRING_BATCH_SIZE_MIN"
            :max="STRING_BATCH_SIZE_MAX"
          />
        </label>
        <span class="counter-info"
          >{{ resolvedContentLength }} / {{ pythonValue.length }}</span
        >
      </div>
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.str {
  display: flex;
  justify-content: start;
  flex-direction: column;
  font-family: monospace;
  font-size: 1.2em;

  .string {
    white-space: pre-wrap;
    word-break: break-all;
    padding-left: 0;

    .not-resolved {
      cursor: pointer;
      font-weight: bold;

      &:hover {
        opacity: 0.8;
      }
    }
  }

  .counter-row {
    margin-top: 3px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 0.75em;
    color: #3f3f3f;
  }

  .field-group {
    display: inline-flex;
    align-items: center;
    border: 1px solid #858585;
    background: #f4f4f4;
  }

  .field-label {
    padding: 0 6px;
  }
  .counter-info {
    width: fit-content;
  }
  .counter-input {
    width: 60px;
    border: none;
    border-left: 1px solid #858585;
    text-align: center;
    background: white;
  }
}
</style>
