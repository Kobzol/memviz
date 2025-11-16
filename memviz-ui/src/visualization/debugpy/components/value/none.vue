<script setup lang="ts">
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import { computed } from "vue";
import { NoneVal } from "process-def/debugpy";

const props = defineProps<{
  value: NoneVal;
}>();

const tooltip = computed(() => {
  return `Id: <b>${props.value.id}</b>`;
});
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <div class="none">
      <code class="string">None</code>
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.none {
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
