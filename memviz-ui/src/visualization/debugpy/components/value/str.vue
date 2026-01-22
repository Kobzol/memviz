<script setup lang="ts">
import { computed, ref } from "vue";
import { processResolver } from "../../../store";
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import { LazyStrVal } from "../../type/lazy-value";
import { assert } from "../../../../utils";
import { valueState } from "../../store";
import { isStr } from "../../utils/types";
import { PythonId } from "process-def/debugpy";

const props = defineProps<{
  id: PythonId;
}>();

const pythonValue = computed(() => {
  const val = valueState.value.getValueOrThrow(props.id);
  assert(isStr(val), `Value with id ${props.id} is not a LazyStrVal`);
  return val as LazyStrVal;
});
const resolvedContent = ref<string>("");
const isLoaded = ref(false);

const resolver = computed(() => processResolver.value);

async function loadData() {
  if (!resolver.value) return;

  if (pythonValue.value.length === 0) {
    resolvedContent.value = "";
    isLoaded.value = true;
    return;
  }
  const resolvedChars = await pythonValue.value.getElements(
    resolver.value.debugpy,
    0,
    pythonValue.value.length,
  );
  resolvedContent.value = resolvedChars.join("");
  isLoaded.value = true;
}

const tooltip = computed(() => {
  return `Id: <b>${props.id}</b>, size: <b>${pythonValue.value.size} B</b>`;
});

function onClick() {
  loadData();
}
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <div class="str">
      <code v-if="isLoaded" class="string"> "{{ resolvedContent }}" </code>

      <code v-else class="not-resolved" @click="onClick"> ... </code>
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
  }

  .not-resolved {
    &:hover {
      cursor: pointer;
    }
  }
}
</style>
