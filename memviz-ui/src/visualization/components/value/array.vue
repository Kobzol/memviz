<script setup lang="ts">
import { type Ref, computed, ref, watch } from "vue";
import { addressToStr, assert } from "../../../utils";
import { appState } from "../../store";
import { type Value } from "../../formatting";
import { TyArray, Type } from "process-def";
import ValueComponent from "./value.vue";
import { Path } from "../../pointers/path";

const props = defineProps<{
  value: Value<TyArray>;
  path: Path;
}>();

const DEFAULT_ELEMENT_COUNT = 5;

async function loadData() {
  const address = props.value.address;
  if (address === null) {
    return;
  }

  const innerType = props.value.type.type;

  const index = startIndex.value;
  const count = activeCount.value;

  const startAddress = address + BigInt(index * innerType.size);

  // Preload the memory of the individual array elements
  await resolver.value.readMemory(
    addressToStr(startAddress),
    innerType.size * count
  );
}

function createValue(listIndex: number): Value<Type> {
  const index = startIndex.value + listIndex;

  const { type, address } = props.value;
  assert(index >= 0, "array index negative");
  assert(index < type.element_count, "array index out of bounds");

  // Address should not be null, otherwise elementsToShow would be zero
  return {
    address: address! + BigInt(index * type.type.size),
    type: type.type,
  };
}

function createPath(listIndex: number): Path {
  return props.path.makeArrayIndex(startIndex.value + listIndex);
}

// How many elements are actively being shown now
const activeCount = computed(() => {
  const start = startIndex.value;
  const remaining = Math.max(0, props.value.type.element_count - start);
  return Math.min(remaining, targetCount.value);
});

const resolver = computed(() => appState.value.resolver);

// How many elements the user wants to show
const targetCount: Ref<number> = ref(DEFAULT_ELEMENT_COUNT);

// From which index we load the elements
const startIndex: Ref<number> = ref(0);

watch(
  () => [props.value, activeCount.value, resolver.value],
  () => loadData(),
  { immediate: true }
);
</script>

<template>
  <div class="array">
    <div class="element" v-for="(_, index) in activeCount">
      <ValueComponent :value="createValue(index)" :path="createPath(index)" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.array {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: start;
  padding: 0px 5px;
}

.element {
  min-width: 40px;
  border: 1px solid #000000;
  display: flex;
  justify-content: center;
}
</style>
