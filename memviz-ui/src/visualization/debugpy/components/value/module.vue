<script setup lang="ts">
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import { computed } from "vue";
import { RichModuleVal } from "../../type/type";
import { assert } from "../../../../utils";
import { valueState } from "../../store";
import { isModule } from "../../utils/types";
import { PythonId } from "process-def/debugpy";

const props = defineProps<{
  id: PythonId;
}>();

const pythonValue = computed(() => {
  const val = valueState.value.getValueOrThrow(props.id);
  assert(isModule(val), `Value with id ${props.id} is not a RichModuleVal`);
  return val as RichModuleVal;
});
const tooltip = computed(() => {
  return `Id: <b>${pythonValue.value.id}</b>`;
});
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <div class="module">
      <code class="string">
        {{ pythonValue.name }}
      </code>
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.module {
  display: flex;
  justify-content: start;
  font-family: monospace;
  font-size: 1.2em;
}

.string {
  padding: 1px 0;
}
</style>
