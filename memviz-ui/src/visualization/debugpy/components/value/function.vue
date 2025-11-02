<script setup lang="ts">
import { FunctionVal } from "process-def/debugpy";

const props = defineProps<{
  value: FunctionVal;
  level: number;
}>();
</script>

<template>
  <div class="function">
    <span class="string">Function: {{ props.value.name }}</span>
    <span class="string">Qualified Name: {{ props.value.qualified_name }}</span>
    <span class="string">Module: {{ props.value.module }}</span>
    <span class="string">Signature: {{ props.value.signature }}</span>
  </div>
</template>

<style scoped lang="scss">
.function {
  display: flex;
  justify-content: end;
  padding: 0px 5px;
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
