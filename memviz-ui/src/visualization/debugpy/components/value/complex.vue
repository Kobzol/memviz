<script setup lang="ts">
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import { computed } from "vue";
import { RichComplexVal } from "../../type/type";
import { isComplex } from "../../utils/types";
import { valueState } from "../../store";
import { assert } from "../../../../utils";
import { PythonId } from "process-def/debugpy";

const props = defineProps<{
  id: PythonId;
}>();

const pythonValue = computed(() => {
  let val = valueState.value.getValueOrThrow(props.id);
  assert(isComplex(val), `Value with id ${props.id} is not a RichComplexVal`);
  return val as RichComplexVal;
});

const displayValue = computed(() => {
  const real_value = Number(pythonValue.value.real_value);
  const imaginary_value = Number(pythonValue.value.imaginary_value);
  return `${real_value} + ${imaginary_value}j`;
});

const tooltip = computed(() => {
  return `Id: <b>${props.id}</b>, size: <b>${pythonValue.value.size} B</b>`;
});
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <div class="complex">
      <code class="string">
        {{ displayValue }}
      </code>
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.complex {
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
