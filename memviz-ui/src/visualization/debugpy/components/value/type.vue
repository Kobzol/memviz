<script setup lang="ts">
import { TypeVal } from "process-def/debugpy";
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import { computed } from "vue";

const props = defineProps<{
  value: TypeVal;
}>();

const tooltip = computed(() => {
  return `Type <b>${props.value.module}.${props.value.name}</b>, Id: <b>${props.value.id}</b>`;
});
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <div class="type">
      <code class="string">
        {{ value.name }}
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
}

.string {
  padding: 1px 0;
}
</style>
