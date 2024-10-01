<script setup lang="ts">
import { computed, watch } from "vue";
import { appState, componentMap, tooltipStack } from "./store";
import StackFrameComponent from "./components/stackframe.vue";
import TooltipContent from "./components/tooltip/tooltip-content.vue";
import Configuration from "./components/configuration.vue";

const state = computed(() => appState.value.processState);

// Code for debugging pointer targets
// watch(componentMap, () => {
//   document.querySelectorAll(".ptr-target").forEach((el) => {
//     el.classList.remove("ptr-target");
//   });
//   for (const component of componentMap.value.getAllComponents()) {
//     component.element.classList.add("ptr-target");
//   }
// });
</script>

<template>
  <div class="app">
    <Configuration />
    <div class="address-space">
      <StackFrameComponent
        v-for="frame in state.stackTrace.frames.slice().reverse()"
        :key="frame.id"
        :frame="frame"
      />
    </div>
    <TooltipContent :tooltips="tooltipStack" />
  </div>
</template>

<style lang="scss">
@import "normalize.css";

.ptr-target {
  border: 2px solid red;
}

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
  background-color: none;
}
</style>

<style lang="scss" scoped>
.app {
  padding: 10px 40px;
}
</style>
