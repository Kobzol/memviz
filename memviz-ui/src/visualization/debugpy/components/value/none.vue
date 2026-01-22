<script setup lang="ts">
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import { computed } from "vue";
import { RichNoneVal } from "../../type/type";
import { assert } from "../../../../utils";
import { valueState } from "../../store";
import { isNone } from "../../utils/types";
import { PythonId } from "process-def/debugpy";

const props = defineProps<{
  id: PythonId;
}>();

const pythonValue = computed(() => {
  const val = valueState.value.getValueOrThrow(props.id);
  assert(isNone(val), `Value with id ${props.id} is not a RichNoneVal`);
  return val as RichNoneVal;
});
const tooltip = computed(() => {
  return `Id: <b>${pythonValue.value.id}</b>, size: <b>${pythonValue.value.size} B</b>`;
});
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <div class="none">
      <code class="string">None</code>
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.none {
  display: flex;
  justify-content: start;
  font-family: monospace;
  font-size: 1.2em;

  &:hover {
    cursor: pointer;
  }
}

.string {
  padding: 1px 0;
}
</style>
