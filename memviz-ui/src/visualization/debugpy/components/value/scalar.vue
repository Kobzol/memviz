<script setup lang="ts">
import { computed } from "vue";
import { isScalar, RichScalarVal } from "../../utils/types";
import { valueState } from "../../store";
import { assert } from "../../../../utils";
import { PythonId } from "process-def/debugpy";

const props = defineProps<{
  id: PythonId;
}>();

const pythonValue = computed(() => {
  const val = valueState.value.getValueOrThrow(props.id);
  assert(isScalar(val), `Value with id ${props.id} is not a RichScalarVal`);
  return val as RichScalarVal;
});
</script>

<template>
  <div class="scalar">
    <code class="string">
      {{ pythonValue.value }}
    </code>
  </div>
</template>

<style scoped lang="scss">
.scalar {
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
