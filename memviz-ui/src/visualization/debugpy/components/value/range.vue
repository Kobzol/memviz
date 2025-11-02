<script setup lang="ts">
import { RangeVal } from "process-def/debugpy";

const props = defineProps<{
  value: RangeVal;
  level: number;
}>();
</script>

<template>
  <div class="range">
    <span class="string">start: {{ props.value.start }}</span>
    <span class="string">stop: {{ props.value.stop }}</span>
    <span class="string">step: {{ props.value.step }}</span>
  </div>
</template>

<style scoped lang="scss">
.range {
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
