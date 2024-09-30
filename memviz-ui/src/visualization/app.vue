<script setup lang="ts">
import { computed, watch } from "vue";
import { appState, componentMap, tooltipStack } from "./store";
import StackFrameComponent from "./components/stackframe.vue";
import TooltipContent from "./components/tooltip/tooltip-content.vue";

const state = computed(() => appState.value.processState);
watch(componentMap, () => {
  componentMap.value.dump();
});
</script>

<template>
  <TooltipContent :tooltips="tooltipStack" />
  <div>
    <StackFrameComponent
      v-for="frame in state.stackTrace.frames.slice().reverse()"
      :key="frame.id"
      :frame="frame"
    />
  </div>
</template>

<style lang="scss">
@import "normalize.css";

html {
  width: 100%;
  height: 100%;
}

body {
  // This enables tippy tooltip to be positioned correctly even after panning the canvas
  position: relative;
  width: 100%;
  height: 100%;
  color: #000000;
}
code {
  color: #000000;
  background-color: #ffffff;
}
</style>
