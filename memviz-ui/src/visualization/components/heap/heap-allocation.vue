<script setup lang="ts">
import { computed, ShallowRef, shallowRef, watchEffect } from "vue";
import { HeapAllocation } from "../../../allocation-tracker";
import { AddressRegion } from "../../pointers/region";
import { Path } from "../../pointers/path";
import { formatAddress, formatSize } from "../../utils/formatting";
import { pointerMap } from "../../store";
import { TyArray, Type } from "process-def";
import { Value } from "../../utils/value";
import PtrTarget from "../ptrtarget.vue";
import ValueComponent from "../value/value.vue";

const props = defineProps<{
  allocation: HeapAllocation;
}>();

function checkPointerSource() {
  const source = pointerMap.value.getPointerForRegion(region.value);
  if (source === null) {
    activeType.value = null;
    return;
  }

  activeType.value = source.type;
}

const activeType: ShallowRef<Type | null> = shallowRef(null);

const region = computed(
  (): AddressRegion => ({
    address: props.allocation.address,
    size: props.allocation.size,
  })
);
const path = computed((): Path => Path.heapAlloc(props.allocation.address));
const value = computed((): Value<Type> | null => {
  const innerType = activeType.value;
  if (innerType === null) return null;

  const elementCount = props.allocation.size / innerType.size;
  const derivedType: TyArray = {
    kind: "array",
    name: `${innerType.name}[${elementCount}]`,
    size: props.allocation.size,
    type: innerType,
    element_count: elementCount,
  };

  return {
    address: props.allocation.address,
    type: derivedType,
  };
});

watchEffect(() => {
  checkPointerSource();
});
</script>

<template>
  <PtrTarget :region="region" :path="path">
    <div v-if="value !== null">
      <ValueComponent :path="path" :value="value" />
    </div>
    <div v-else>
      {{ formatAddress(props.allocation.address) }} ({{
        formatSize(allocation.size)
      }})
    </div>
  </PtrTarget>
</template>

<style lang="scss" scoped></style>
