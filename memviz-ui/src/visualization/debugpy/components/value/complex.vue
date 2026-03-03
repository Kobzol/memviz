<script setup lang="ts">
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
  return `${real_value} ${imaginary_value >= 0 ? "+" : "-"} ${Math.abs(imaginary_value)}j`;
});
</script>

<template>
  <div class="complex">
    <code class="string">
      {{ displayValue }}
    </code>
  </div>
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
