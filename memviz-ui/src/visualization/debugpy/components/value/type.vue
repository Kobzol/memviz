<script setup lang="ts">
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import { computed } from "vue";
import { RichTypeVal } from "../../type/type";
import { assert } from "../../../../utils";
import { valueState } from "../../store";
import { isType } from "../../utils/types";
import { PythonId } from "process-def/debugpy";

const props = defineProps<{
  id: PythonId;
}>();

const pythonValue = computed(() => {
  const val = valueState.value.getValueOrThrow(props.id);
  assert(isType(val), `Value with id ${props.id} is not a RichTypeVal`);
  return val as RichTypeVal;
});
const tooltip = computed(() => {
  return `Type <b>${pythonValue.value.module}.${pythonValue.value.name}</b>, Id: <b>${pythonValue.value.id}</b>`;
});
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <div class="type">
      <code class="string">
        {{ pythonValue.name }}
      </code>
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.scalar {
  display: flex;
  justify-content: start;
  font-family: monospace;
  font-size: 1.2em;
}

.string {
  padding: 1px 0;
}
</style>
