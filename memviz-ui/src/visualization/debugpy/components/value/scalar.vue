<script setup lang="ts">
import { ScalarVal } from "../../utils/types";

const props = defineProps<{
  value: ScalarVal;
}>();
</script>

<template>
  <div class="scalar">
    <code class="string">
      {{ value.value }}
    </code>
  </div>
</template>

<style scoped lang="scss">
.scalar {
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
