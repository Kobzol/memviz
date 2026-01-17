<script setup lang="ts">
import { computed } from "vue";
import { DisplayMode } from "../../value-display-settings";
import MemorySlot from "../memory-slot.vue";
import { valueState } from "../../store";

const values = computed(() => valueState.value.getValues());
</script>

<template>
  <div class="heap" v-if="values.length > 0">
    <div class="header">Heap</div>
    <MemorySlot
      v-for="value in values"
      :key="value.id"
      :value="value"
      :context="DisplayMode.DETACHED"
    />
  </div>
</template>

<style lang="scss" scoped>
.heap {
  min-width: 300px;
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
