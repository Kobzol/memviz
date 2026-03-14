<script setup lang="ts">
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
</script>

<template>
  <div class="type">
    <code class="string">
      {{ pythonValue.name }}
    </code>
  </div>
</template>

<style scoped lang="scss">
.type {
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
