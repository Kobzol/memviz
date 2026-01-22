<script setup lang="ts">
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import { computed } from "vue";
import { RichRangeVal } from "../../type/type";
import { assert } from "../../../../utils";
import { valueState } from "../../store";
import { isRange } from "../../utils/types";
import { PythonId } from "process-def/debugpy";

const props = defineProps<{
  id: PythonId;
}>();

const pythonValue = computed(() => {
  const val = valueState.value.getValueOrThrow(props.id);
  assert(isRange(val), `Value with id ${props.id} is not a RichRangeVal`);
  return val as RichRangeVal;
});
const tooltip = computed(() => {
  return `Id: <b>${pythonValue.value.id}</b>, size: <b>${pythonValue.value.size} B</b>`;
});
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <div class="range">
      <span class="string">start: {{ pythonValue.start }}</span>
      <span class="string">stop: {{ pythonValue.stop }}</span>
      <span class="string">step: {{ pythonValue.step }}</span>
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.range {
  display: flex;
  justify-content: start;
  flex-direction: column;

  &:hover {
    cursor: pointer;
  }
}

.value {
  margin-left: 5px;
}

.string {
  padding: 1px 0;
}
</style>
