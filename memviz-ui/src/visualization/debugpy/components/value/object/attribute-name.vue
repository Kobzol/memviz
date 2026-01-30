<script setup lang="ts">
import { computed } from "vue";
import TooltipContributor from "../../../../components/tooltip/tooltip-contributor.vue";
import { RichAttribute } from "../../../type/type";

const props = defineProps<{
  attribute: RichAttribute;
}>();

const tooltip = computed(() => {
  let res = `Attribute: <b>${props.attribute.name}</b>`;
  if (props.attribute.is_descriptor) {
    res += " (descriptor)";
  }
  return res;
});
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <div>{{ attribute.name }}</div>
  </TooltipContributor>
</template>
