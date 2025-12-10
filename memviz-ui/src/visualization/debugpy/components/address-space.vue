<script setup lang="ts">
import Frames from "./places/frames.vue";
</script>

<template>
  <div class="address-space">
    <Frames class="frames"></Frames>
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
