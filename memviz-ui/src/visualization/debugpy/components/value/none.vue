<script setup lang="ts">
import { NoneVal } from "process-def/debugpy";

const props = defineProps<{
  value: NoneVal;
}>();
</script>

<template>
  <div class="none">
    <code class="string">None</code>
  </div>
</template>

<style scoped lang="scss">
.none {
  display: flex;
  justify-content: end;
  padding: 0px 5px;
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
