<script setup lang="ts">
import { computed } from "vue";
import { HeapAllocation } from "../../../allocation-tracker";
import PtrTarget from "../ptrtarget.vue";
import { AddressRegion } from "../../pointers/region";
import { Path } from "../../pointers/path";

const props = defineProps<{
  allocation: HeapAllocation;
}>();

const region = computed(
  (): AddressRegion => ({
    address: props.allocation.address,
    size: props.allocation.size,
  })
);
const path = computed((): Path => Path.heapAlloc(props.allocation.address));
</script>

<template>
  <PtrTarget :region="region" :path="path"
    >Heap alloc at 0x{{ props.allocation.address.toString(16) }}</PtrTarget
  >
</template>

<style lang="scss" scoped></style>
