<script setup lang="ts">
import { Place, Value } from "process-def/debugpy";
import { computed } from "vue";
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import ValueComponent from "../value/value.vue";

const props = defineProps<{
  place: Place;
  value: Value | null;
}>();

const tooltip = computed(() => {
  const type = props.value?.kind;
  let title = "";
  title += `Place <b>${props.place.name}</b>`;
  if (type) {
    title += ` of type <b>${type}</b>`;
  }
  title += `, id <b>${props.place.id}</b>`;
  return title;
});
</script>

<template>
  <div class="place">
    <code
      ><TooltipContributor :tooltip="tooltip">{{
        props.place.name
      }}</TooltipContributor></code
    >
    <ValueComponent v-if="value" :value="value" />
  </div>
</template>

<style scoped lang="scss">
.place {
  width: 100%;
  padding: 2px;

  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  border: 1px solid #000000;
}
</style>
