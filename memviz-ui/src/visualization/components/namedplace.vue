<script setup lang="ts">
import { PlaceKind, type Address, type Place, type Type } from "process-def";
import { computed } from "vue";
import { strToAddress } from "../../utils";
import { formatTypeSize, type Value } from "../formatting";
import ValueComponent from "./value/value.vue";
import { Path } from "../pointers/path";

const props = defineProps<{
  place: Place;
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
const title = computed(() => {
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
  title += `, ${formatTypeSize(type)}`;
  title += `, <b>${props.place.initialized ? "" : "not "}initialized</b>`;
  title += `, declared at line ${props.place.line}`;
  return title;
});
const path = computed((): Path => {
  return Path.rootStackFrame(props.place.name);
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
      v-tippy="title"
      >{{ label }}</code
    >
    <ValueComponent :value="value" :path="path" />
  </div>
</template>

<style scoped lang="scss">
.place {
  width: 100%;
  padding: 2px;

  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;

  .decl {
    border: 3px solid #000000;
    padding: 3px;
    margin-right: 5px;
    font-size: 1.1em;
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
