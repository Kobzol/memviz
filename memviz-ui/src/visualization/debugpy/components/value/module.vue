<script setup lang="ts">
import { ModuleVal } from "process-def/debugpy";
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import { computed } from "vue";

const props = defineProps<{
  value: ModuleVal;
}>();

const tooltip = computed(() => {
  return `Id: <b>${props.value.id}</b>`;
});
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <div class="module">
      <code class="string">
        {{ value.name }}
      </code>
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.module {
  display: flex;
  justify-content: start;
  font-family: monospace;
  font-size: 1.2em;
}

.string {
  padding: 1px 0;
}
</style>
