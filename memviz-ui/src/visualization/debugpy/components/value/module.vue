<script setup lang="ts">
import { ModuleVal } from "process-def/debugpy";

const props = defineProps<{
  value: ModuleVal;
}>();
</script>

<template>
  <div class="module">
    <code class="string">
      {{ value.name }}
    </code>
  </div>
</template>

<style scoped lang="scss">
.module {
  display: flex;
  justify-content: end;
  padding: 0px 5px;
  font-family: monospace;
  font-size: 1.2em;
}

.string {
  padding: 1px 0;
}
</style>
