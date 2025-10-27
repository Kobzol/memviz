<script setup lang="ts">
import { ComplexVal } from "process-def/debugpy";
import { computed } from "vue";

const props = defineProps<{
  value: ComplexVal;
}>();

const displayValue = computed(() => {
  const real_value = Number(props.value.real_value);
  const imaginary_value = Number(props.value.imaginary_value);
  return `${real_value} + ${imaginary_value}j`;
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
