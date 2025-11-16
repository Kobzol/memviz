<script setup lang="ts">
import { RangeVal } from "process-def/debugpy";
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import { computed } from "vue";

const props = defineProps<{
  value: RangeVal;
}>();

const tooltip = computed(() => {
  return `Id: <b>${props.value.id}</b>`;
});
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <div class="range">
      <span class="string">start: {{ value.start }}</span>
      <span class="string">stop: {{ value.stop }}</span>
      <span class="string">step: {{ value.step }}</span>
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.range {
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
