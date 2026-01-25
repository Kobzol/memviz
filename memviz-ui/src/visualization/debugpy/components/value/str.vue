<script setup lang="ts">
import { computed, ref } from "vue";
import { processResolver } from "../../../store";
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import { assert } from "../../../../utils";
import { valueState } from "../../store";
import { isStr } from "../../utils/types";
import { PythonId } from "process-def/debugpy";
import { STRING_BATCH_SIZE } from "../../value-display-settings";

const props = defineProps<{
  id: PythonId;
}>();

const batchSize = STRING_BATCH_SIZE;
const visibleLimit = ref(batchSize);

const pythonValue = computed(() => {
  const val = valueState.value.getValueOrThrow(props.id);
  assert(isStr(val), `Value with id ${props.id} is not a LazyStrVal`);
  return val;
});

const resolvedContent = computed(() => {
  const val = pythonValue.value;
  if (val.length === 0) return "";

  const elements = val.getFetchedElements(0, visibleLimit.value);

  let result = "";
  for (const char of elements) {
    if (char === null) break;
    result += char;
  }
  return result;
});

const resolver = computed(() => processResolver.value);

async function loadMoreData() {
  if (!resolver.value) return;
  const val = pythonValue.value;

  visibleLimit.value += batchSize;

  const currentLen = resolvedContent.value.length;
  const count = visibleLimit.value - currentLen;

  if (count > 0 && currentLen < val.length) {
    await val.getElements(resolver.value.debugpy, currentLen, count);
  }
}

const escapedContent = computed(() => {
  return resolvedContent.value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'");
});

const tooltip = computed(() => {
  return `Id: <b>${props.id}</b>, size: <b>${pythonValue.value.size} B</b>`;
});

const isLoaded = computed(() => {
  return resolvedContent.value.length >= pythonValue.value.length;
});
</script>

<template>
  <TooltipContributor :tooltip="tooltip" :key="id">
    <div class="str">
      <code class="string"
        ><span v-if="isLoaded">"</span>{{ escapedContent
        }}<span v-if="!isLoaded" class="not-resolved" @click="loadMoreData"
          >...</span
        ><span v-else>"</span></code
      >
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.str {
  display: flex;
  justify-content: start;
  font-family: monospace;
  font-size: 1.2em;

  .string {
    white-space: pre-wrap;
    word-break: break-all;

    .not-resolved {
      cursor: pointer;
      font-weight: bold;

      &:hover {
        opacity: 0.8;
      }
    }
  }
}
</style>
