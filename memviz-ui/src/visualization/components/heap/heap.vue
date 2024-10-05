<script setup lang="ts">
import { ShallowRef, shallowRef, watch } from "vue";
import { allocationState } from "../../store";
import { HeapAllocation } from "../../../allocation-tracker";
import HeapAllocationComponent from "./heap-allocation.vue";

const allocations: ShallowRef<HeapAllocation[]> = shallowRef([]);

watch(
  allocationState,
  () => {
    allocations.value = allocationState.value.getAllocations();
  },
  { immediate: true }
);
</script>

<template>
  <div class="heap">
    <div class="header">Heap</div>
    <HeapAllocationComponent
      v-for="allocation in allocations"
      :key="allocation.address.toString(16)"
      :allocation="allocation"
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
