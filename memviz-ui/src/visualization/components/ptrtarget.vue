<script setup lang="ts">
import { onBeforeUnmount, onMounted, Ref, ref, watch } from "vue";
import { Value } from "../utils/formatting";
import { Type } from "process-def";
import { componentMap } from "../store";
import { assert } from "../../utils";
import { ComponentUnsubscribeFn } from "../pointers/component-map";

const props = defineProps<{
  value: Value<Type>;
}>();

// Updates the HTML element of this PointerTarget in the component map,
// at the specified address
function updateComponentInMap() {
  assert(elementRef.value !== null, "component has not been mounted yet");

  removeComponentFromMap();

  const address = props.value.address;
  if (address === null) {
    return;
  }

  unsubscribeFn.value = componentMap.value.addComponent(
    address,
    props.value.type.size,
    elementRef.value,
    componentMap
  );
}

function removeComponentFromMap() {
  if (unsubscribeFn.value !== null) {
    unsubscribeFn.value();
    unsubscribeFn.value = null;
  }
}

const elementRef = ref<HTMLElement | null>(null);
const unsubscribeFn: Ref<ComponentUnsubscribeFn | null> = ref(null);

onMounted(() => updateComponentInMap());
onBeforeUnmount(() => removeComponentFromMap());
watch(
  () => props.value,
  () => updateComponentInMap()
);
</script>

<template>
  <div :ref="(el: any) => elementRef = el">
    <slot></slot>
  </div>
</template>
