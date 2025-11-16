<script setup lang="ts">
import { FunctionVal } from "process-def/debugpy";
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import { computed } from "vue";

const props = defineProps<{
  value: FunctionVal;
}>();

const tooltip = computed(() => {
  let escapedQualifiedName = props.value.qualified_name
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  let result = `Function <b>${escapedQualifiedName}</b>`;

  if (props.value.module) {
    result += ` in module <b>${props.value.module}</b>`;
  }

  result += `, Id: <b>${props.value.id}</b>`;

  if (props.value.signature) {
    result += `<b><pre>${props.value.name}${props.value.signature}</pre></b>`;
  }

  return result;
});
</script>

<template>
  <TooltipContributor :tooltip="tooltip"
    ><div class="function">
      <span class="string">{{ value.name }}</span>
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.function {
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
