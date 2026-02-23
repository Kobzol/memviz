<script setup lang="ts">
import Heap from "./heap/heap.vue";
import Frames from "./places/frames.vue";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { debugpyComponentMap } from "../store";

const rootRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;
let mutationObserver: MutationObserver | null = null;
let pendingFrame: number | null = null;

const scheduleArrowsUpdate = () => {
  if (pendingFrame !== null) return;

  pendingFrame = requestAnimationFrame(() => {
    debugpyComponentMap.value.repositionArrows();
    pendingFrame = null;
  });
};

const onWindowResize = () => {
  scheduleArrowsUpdate();
};

onMounted(() => {
  if (!rootRef.value) return;

  window.addEventListener("resize", onWindowResize);
  window.visualViewport?.addEventListener("resize", onWindowResize);

  resizeObserver = new ResizeObserver(() => {
    scheduleArrowsUpdate();
  });
  resizeObserver.observe(rootRef.value);

  mutationObserver = new MutationObserver(() => {
    scheduleArrowsUpdate();
  });
  mutationObserver.observe(rootRef.value, {
    childList: true,
    subtree: true,
  });

  scheduleArrowsUpdate();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onWindowResize);
  window.visualViewport?.removeEventListener("resize", onWindowResize);

  if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
  resizeObserver?.disconnect();
  mutationObserver?.disconnect();
});
</script>

<template>
  <div class="address-space" ref="rootRef">
    <Frames class="frames"></Frames>
    <Heap></Heap>
  </div>
</template>

<style lang="scss" scoped>
.address-space {
  display: flex;
  flex-direction: row;
  justify-content: start;
}
.frames {
  margin-right: 100px;
}
</style>
