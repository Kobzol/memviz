<script setup lang="ts">
import { type Ref, computed, ref, watch } from "vue";
import { addressToStr, assert } from "../../../../utils";
import { appState } from "../../../store";
import { pluralize } from "../../../utils/formatting";
import { TyArray, Type } from "process-def";
import ValueComponent from "../value.vue";
import { Path } from "../../../pointers/path";
import TooltipContributor from "../../tooltip/tooltip-contributor.vue";
import PtrTarget from "../../ptr-target.vue";
import { Value, valueToRegion } from "../../../utils/value";

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

function prevTitle(): string {
  const count = Math.min(targetCount.value, precedingCount.value);
  return `Show ${count} previous ${pluralize("element", count)}`;
}
function nextTitle(): string {
  const count = Math.min(targetCount.value, followingCount.value);
  return `Show ${count} next ${pluralize("element", count)}`;
}

function movePrev() {
  startIndex.value = Math.max(0, startIndex.value - targetCount.value);
}

function moveNext() {
  startIndex.value = Math.min(
    lastValidIndex.value,
    startIndex.value + targetCount.value
  );
}

// How many elements are actively being shown now
const activeCount = computed(() => {
  const start = startIndex.value;
  const remaining = Math.max(0, props.value.type.element_count - start);
  return Math.min(remaining, targetCount.value);
});
const lastValidIndex = computed(() => {
  return Math.max(0, props.value.type.element_count - targetCount.value);
});

const precedingCount = computed(() => startIndex.value);
const followingCount = computed(() => {
  const end = startIndex.value + activeCount.value;
  return props.value.type.element_count - end;
});

const tooltip = computed(() => {
  const count = props.value.type.element_count;
  return `Array with ${count} ${pluralize(
    "element",
    count
  )}, current index <b>${startIndex.value}</b>, showing <b>${
    activeCount.value
  }</b> ${pluralize("element", activeCount.value)}`;
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
  <TooltipContributor :tooltip="tooltip">
    <div class="array">
      <div class="offset" v-if="precedingCount > 0" @click="movePrev">
        <TooltipContributor :tooltip="prevTitle()">
          {{ precedingCount }} more
        </TooltipContributor>
      </div>
      <PtrTarget
        class="element-wrapper"
        :region="valueToRegion(value)"
        :path="path"
      >
        <div class="element" v-for="(_, index) in activeCount">
          <ValueComponent
            :value="createValue(index)"
            :path="createPath(index)"
          />
        </div>
      </PtrTarget>
      <div class="offset" v-if="followingCount > 0" @click="moveNext">
        <TooltipContributor :tooltip="nextTitle()">
          {{ followingCount }} more
        </TooltipContributor>
      </div>
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.array {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: start;
  padding: 0px 5px;
}

.element-wrapper {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.element {
  min-width: 40px;
  padding: 1px;
  border: 1px solid #000000;
  display: flex;
  justify-content: center;
}
.offset {
  @extend .element;

  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 5px;
  cursor: pointer;

  &:first-child {
    margin-right: 5px;
    // TODO: make nicer
    border-radius: 50% 0 0 50%;
  }
  &:last-child {
    margin-left: 5px;
    border-radius: 0 50% 50% 0;
  }
}
</style>
