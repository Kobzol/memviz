<script setup lang="ts">
import { computed } from "vue";
import { appState } from "./store";
import StackFrameComponent from "./components/stackframe.vue";

const state = computed(() => appState.value.processState);
</script>

<template>
  <div>
    <StackFrameComponent v-for="frame in state.stackTrace.frames.slice().reverse()" :frame="frame" />
  </div>
</template>
