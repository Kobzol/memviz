<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  Ref,
  ref,
  watch,
} from "vue";
import { componentMap } from "../store";
import { assert } from "../../utils";
import { ComponentUnsubscribeFn } from "../pointers/component-map";
import { AddressRegion } from "../pointers/region";
import { Path } from "../pointers/path";

const props = defineProps<{
  region: AddressRegion;
  path: Path;
}>();

// Updates the HTML element of this PointerTarget in the component map,
// at the specified address
async function updateComponentInMap() {
  assert(elementRef.value !== null, "component has not been mounted yet");

  removeComponentFromMap();

  const address = props.region.address;
  if (address === null) {
    return;
  }

  // This is required to wait for browser relayout, to make sure
  // that the element has the final layout before it is registered
  window.requestAnimationFrame(() => {
    if (elementRef.value !== null) {
      unsubscribeFn.value = componentMap.value.addComponent(
        {
          address,
          element: elementRef.value,
          size: props.region.size,
          path: props.path,
        },
        componentMap
      );
    }
  });
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
onUpdated(() => updateComponentInMap());
onBeforeUnmount(() => removeComponentFromMap());
watch(
  () => props.region,
  () => updateComponentInMap()
);
</script>

<template>
  <div :ref="(el: any) => elementRef = el">
    <slot></slot>
  </div>
</template>
