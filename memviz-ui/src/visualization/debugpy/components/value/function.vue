<script setup lang="ts">
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
</script>

<template>
  <div class="function">
    <span class="string">{{ pythonValue.qualified_name }}</span>
  </div>
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
