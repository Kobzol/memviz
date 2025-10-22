<script setup lang="ts">
import Stack from "./stack/stack.vue";
import Heap from "./heap/heap.vue";
</script>

<template>
  <div class="address-space">
    <Stack class="stack"></Stack>
    <Heap></Heap>
  </div>
</template>

<style lang="scss" scoped>
.address-space {
  display: flex;
  flex-direction: row;
  justify-content: start;
}
.stack {
  margin-right: 100px;
}
</style>
