<script setup lang="ts">
import { computed, ShallowRef, shallowRef, watch, watchEffect } from "vue";
import { HeapAllocation } from "../../../allocation-tracker";
import { AddressRegion } from "../../pointers/region";
import { Path } from "../../pointers/path";
import { formatAddress, formatSize } from "../../utils/formatting";
import { pointerMap } from "../../store";
import { TyArray, Type } from "process-def";
import { Value } from "../../utils/value";
import PtrTarget from "../ptr-target.vue";
import ValueComponent from "../value/value.vue";
import TooltipContributor from "../tooltip/tooltip-contributor.vue";

const props = defineProps<{
  allocation: HeapAllocation;
}>();

function checkPointerSource() {
  const source = pointerMap.value.getPointerForRegion(region.value);
  if (source === null) {
    assumedType.value = null;
    return;
  }

  assumedType.value = computeAssumedType(source.type);
}

function computeAssumedType(typeBeingPointedTo: Type): Type | null {
  const elementCount = props.allocation.size / typeBeingPointedTo.size;
  if (elementCount === 1) {
    return typeBeingPointedTo;
  }

  return {
    kind: "array",
    name: `${typeBeingPointedTo.name}[${elementCount}]`,
    size: props.allocation.size,
    type: typeBeingPointedTo,
    element_count: elementCount,
  } satisfies TyArray;
}

const assumedType: ShallowRef<Type | null> = shallowRef(null);

const region = computed(
  (): AddressRegion => ({
    address: props.allocation.address,
    size: props.allocation.size,
  })
);
const path = computed((): Path => Path.heapAlloc(props.allocation.address));
const value = computed((): Value<Type> | null => {
  if (assumedType.value === null) return null;
  return {
    address: props.allocation.address,
    type: assumedType.value,
  };
});
const tooltip = computed(() => {
  let tooltip = `Heap allocation at ${formatAddress(
    props.allocation.address
  )}, ${formatSize(props.allocation.size)}, `;

  if (assumedType.value !== null) {
    tooltip += `assumed to be of type <b>${assumedType.value.name}</b>`;
  } else {
    tooltip += `unknown type`;
  }
  if (!props.allocation.active) {
    tooltip += ". This allocation has been RELEASED!";
  }

  return tooltip;
});
const text = computed(() => {
  let text = "";
  if (props.allocation.active) {
    text += "Heap allocation";
  } else {
    text += "RELEASED heap allocation";
  }
  text += ` (${props.allocation.size}B)`;
  return text;
});
1;
watchEffect(() => {
  checkPointerSource();
});
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <PtrTarget :region="region" :path="path">
      <div :class="{ allocation: true, freed: !allocation.active }">
        <div v-if="value !== null && allocation.active">
          <ValueComponent :path="path" :value="value" />
        </div>
        <div v-else>{{ text }}</div>
      </div>
    </PtrTarget>
  </TooltipContributor>
</template>

<style lang="scss" scoped>
.allocation {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 5px;
  background: white;

  &.freed {
    opacity: 0.5;
    border: 3px dashed red;
  }
}
</style>
