<script setup lang="ts">
import { computed } from "vue";
import { appState } from "../../store";
import StackFrameComponent from "./stack-frame.vue";

const state = computed(() => appState.value.processState);
</script>

<template>
  <div class="stack">
    <div class="header">Stack</div>
    <StackFrameComponent
      v-for="frame in state.stackTrace.frames.slice().reverse()"
      :key="frame.id"
      :frame="frame"
    />
  </div>
</template>

<style lang="scss" scoped>
.stack {
  max-width: 500px;
}
.header {
  padding: 4px 0;
  text-align: center;
  font-weight: bold;
  border-radius: 10px 10px 0 0;
  border: 1px solid black;
  background-color: #8ccdff;
}
</style>
