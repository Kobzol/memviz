<script setup lang="ts">
import { addToTooltip as addToTooltip, removeFromTooltip } from "../../store";

const props = defineProps<{
  tooltip: string;
}>();

function push() {
  addToTooltip(props.tooltip);
}
function pop() {
  removeFromTooltip();
}
</script>

<template>
  <div @mouseenter="push" @mouseleave="pop">
    <slot></slot>
  </div>
</template>
