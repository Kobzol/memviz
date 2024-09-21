<script setup lang="ts">
import type { Address, Place, Type } from "process-def";
import { computed } from "vue";
import { strToAddress } from "../../utils";
import type { Value } from "../formatting";
import ValueComponent from "./value/value.vue";
import { Path } from "../path";

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
  let name = `${props.place.type.name} ${props.place.name}`;
  if (!props.place.initialized) {
    name += " (uninit)";
  }
  return name;
});
const title = computed(() => {
  const type = props.place.type;
  let title = `${props.place.type.name} ${props.place.name}`;
  title += `, ${type.size} byte${type.size === 1 ? "" : "s"}`;
  title += `, ${props.place.initialized ? "" : "not "}initialized`;
  title += `, declared at line ${props.place.line}`;
  return title;
});
const path = computed((): Path => {
  return Path.rootStackFrame(props.place.name);
});
</script>

<template>
  <div class="place">
    <code class="decl" :title="title">{{ label }}</code>
    <ValueComponent :value="value" :path="path" />
  </div>
</template>

<style scoped lang="scss">
.place {
  width: 100%;
  padding: 2px;

  display: flex;
  flex-direction: row;
  align-items: center;

  .decl {
    margin-right: 5px;
  }
}
</style>
