<script setup lang="ts">
import { PlaceKind, type Address, type Place, type Type } from "process-def";
import { computed } from "vue";
import { strToAddress } from "../../../utils";
import { formatTypeSize } from "../../utils/formatting";
import ValueComponent from "../value/value.vue";
import { Path } from "../../pointers/path";
import TooltipContributor from "../tooltip/tooltip-contributor.vue";
import { Value } from "../../utils/value";

const props = defineProps<{
  place: Place;
  path: Path;
}>();

const address = computed((): Address | null => {
  if (props.place.address === null) {
    return null;
  }
  return strToAddress(props.place.address);
});
const value = computed((): Value<Type> => {
  return {
    type: props.place.type,
    address: address.value,
  };
});
const label = computed(() => {
  return `${props.place.type.name} ${props.place.name}`;
});
const tooltip = computed(() => {
  const type = props.place.type;
  let title = "";
  if (
    props.place.kind === PlaceKind.Variable ||
    props.place.kind === PlaceKind.ShadowedVariable
  ) {
    title = "Local variable";
  } else if (props.place.kind === PlaceKind.Parameter) {
    title = "Function parameter";
  }

  title += ` <b>${props.place.type.name} ${props.place.name}</b>`;
  title += `, address <b>${props.place.address ?? "&lt;missing&gt;"}</b>`;
  title += `, ${formatTypeSize(type)}`;
  title += `, <b>${props.place.initialized ? "" : "not "}initialized</b>`;
  title += `, declared at line ${props.place.line}`;
  return title;
});
</script>

<template>
  <div class="place">
    <code
      :class="{
        decl: true,
        uninit: !place.initialized,
        param: place.kind === PlaceKind.Parameter,
      }"
      ><TooltipContributor :tooltip="tooltip">{{
        label
      }}</TooltipContributor></code
    >
    <ValueComponent v-if="place.initialized" :value="value" :path="path" />
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

  .decl {
    border: 3px solid #000000;
    padding: 3px;
    margin-right: 5px;
    font-size: 1.2em;
    background-color: #a4c5ea;
    border-radius: 5px;

    &.param {
      background-color: #bca9e1;
    }
    &.uninit {
      opacity: 0.5;
    }
  }
}
</style>
