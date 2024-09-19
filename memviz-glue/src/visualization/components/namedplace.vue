<script setup lang="ts">
import type { Address, Place } from "process-def";
import { computed } from "vue";
import { appState } from "../store";
import { strToAddress } from "../../utils";
import type { Value } from "../value";

import ValueComponent from "./value/value.vue";

const props = defineProps<{
  place: Place;
}>();

const resolver = computed(() => appState.value.resolver);
const address = computed((): Address | null => {
  if (props.place.address === null) {
    return null;
  }
  return strToAddress(props.place.address);
});
const value = computed((): Value => {
  return {
    type: props.place.type,
    address: address.value
  };
});
</script>

<template>
  <div class="place">
    <code>{{ props.place.type.name }} {{ props.place.name }}</code>
    <ValueComponent :value="value">
    </ValueComponent>
  </div>
</template>

<style scoped lang="scss">
.place {
  width: 100%;
  padding: 2px;
}
</style>
