<script setup lang="ts">
import { ScalarVal } from "../../utils/types";
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import { computed } from "vue";

const props = defineProps<{
  value: ScalarVal;
}>();

const tooltip = computed(() => {
  return `Id: <b>${props.value.id}</b>`;
});
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <div class="scalar">
      <code class="string">
        {{ value.value }}
      </code>
    </div>
  </TooltipContributor>
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
