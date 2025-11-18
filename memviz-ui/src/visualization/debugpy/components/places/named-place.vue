<script setup lang="ts">
import { Place, PlaceKind, Value } from "process-def/debugpy";
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
  if (props.place.kind === PlaceKind.Return) return "Return values dictionary";
  else {
    title += `Place <b>${props.place.name}</b>`;
    if (type) {
      title += ` of type <b>${type}</b>`;
    }
  }
  title += `, id <b>${props.place.id}</b>`;
  return title;
});
</script>

<template>
  <div class="place">
    <div class="place-name">
      <code v-if="place.kind === PlaceKind.Return" class="ret"> (return) </code>
      <code
        v-else
        :class="{
          param: place.kind === PlaceKind.Parameter,
        }"
        ><TooltipContributor :tooltip="tooltip">{{
          props.place.name
        }}</TooltipContributor></code
      >
    </div>
    <div class="place-value">
      <ValueComponent v-if="value" :value="value" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.place {
  width: 100%;
  padding: 2px;

  display: flex;
  flex-direction: row;

  .place-name {
    flex: 1;
    display: flex;
    align-items: flex-start;
    word-break: break-all;

    code {
      border: 3px solid #000000;
      padding: 3px;
      margin: 5px 5px 0 0;
      font-size: 1.2em;
      background-color: #a4c5ea;
      border-radius: 5px;

      &.ret {
        background-color: #9de19a;
      }

      &.param {
        background-color: #bca9e1;
      }
    }
  }

  .place-value {
    flex: 3;
    min-width: 0;
    word-break: break-all;
  }
}
</style>
