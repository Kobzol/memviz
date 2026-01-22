<script setup lang="ts">
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import { computed } from "vue";
import { RichFunctionVal } from "../../type/type";
import { assert } from "../../../../utils";
import { valueState } from "../../store";
import { isFunction } from "../../utils/types";
import { PythonId } from "process-def/debugpy";

const props = defineProps<{
  id: PythonId;
}>();

const pythonValue = computed(() => {
  const val = valueState.value.getValueOrThrow(props.id);
  assert(isFunction(val), `Value with id ${props.id} is not a RichFunctionVal`);
  return val as RichFunctionVal;
});
const tooltip = computed(() => {
  let escapedQualifiedName = pythonValue.value.qualified_name
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  let result = `Function <b>${escapedQualifiedName}</b>`;

  if (pythonValue.value.module) {
    result += ` in module <b>${pythonValue.value.module}</b>`;
  }

  result += `, Id: <b>${pythonValue.value.id}</b>`;

  if (pythonValue.value.signature) {
    result += `<b><pre>${pythonValue.value.name}${pythonValue.value.signature}</pre></b>`;
  }

  return result;
});
</script>

<template>
  <TooltipContributor :tooltip="tooltip"
    ><div class="function">
      <span class="string">{{ pythonValue.qualified_name }}</span>
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.function {
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
