<script setup lang="ts">
import { onBeforeUnmount, ref, useTemplateRef } from "vue";
import {
  pushTooltip as pushTooltip,
  popTooltip,
  clearTooltip as clearTooltips,
} from "../../store";

const props = defineProps<{
  tooltip: string;
}>();

const active = ref(false);
const element = useTemplateRef("element");

// When a child element is removed from DOM, mouseenter is never triggered :(
function push() {
  if (!active.value && element.value !== null) {
    pushTooltip({ text: props.tooltip, element: element.value });
    active.value = true;
  }
}
function pop() {
  if (active.value) {
    popTooltip();
    active.value = false;
  }
}
onBeforeUnmount(() => {
  if (active.value) {
    clearTooltips();
  }
});
</script>

<template>
  <div @mouseenter="push" @mouseleave="pop" ref="element">
    <slot></slot>
  </div>
</template>
