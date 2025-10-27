<script setup lang="ts">
import { Place, Value } from "process-def/debugpy";
import { computed, ref, watch } from "vue";
import type { Ref } from "vue";
import { appState } from "../../../store";
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";
import { Path } from "../../../gdb/pointers/path";
import { AddressStr, StackFrame } from "process-def";
import NamedPlace from "./named-place.vue";
import { formatLocation } from "../../../utils/formatting";
import { provide } from "vue";

const props = defineProps<{
  frame: StackFrame;
}>();

provide("frameIndex", props.frame.index);

function toggleExpanded() {
  expanded.value = !expanded.value;
}

async function maybeLoadPlaces() {
  if (expanded.value && places.value === null) {
    const variables = await resolver.value.createVariablesRepresentation(
      props.frame.index
    );

    places.value = variables.places;
    values.value = new Map<AddressStr, Value>(
      Object.entries(variables.values).map(([id, val]) => [
        id as AddressStr,
        val,
      ])
    );
  }
}

const resolver = computed(() => appState.value.resolver);
const places: Ref<Place[] | null> = ref(null);
const values: Ref<Map<AddressStr, Value>> = ref(new Map());
const location = computed(() =>
  formatLocation(props.frame.file, props.frame.line)
);
const tooltip = computed(() => {
  return `Stack frame of function <b>${props.frame.name}</b> located at <b>${location.value}</b>`;
});
const isTopFrame = computed(() => props.frame.index === 0);
const expanded = ref(isTopFrame.value);

const path = computed(() => {
  return Path.stackFrame(props.frame.index);
});

watch(
  () => props.frame,
  (newFrame: StackFrame, oldFrame: StackFrame) => {
    if (newFrame.index != oldFrame.index || newFrame.name != oldFrame.name) {
      expanded.value = isTopFrame.value;
    }
  }
);

watch(
  () => [props.frame, resolver],
  () => {
    places.value = null;
    maybeLoadPlaces();
  }
);

watch(
  expanded,
  () => {
    maybeLoadPlaces();
  },
  { immediate: true }
);

// https://www.color-hex.com/color-palette/24003
</script>

<template>
  <div>
    <TooltipContributor :tooltip="tooltip">
      <div
        :class="{ header: true, 'top-frame': isTopFrame }"
        @click="toggleExpanded"
      >
        <div class="name">{{ props.frame.name }}</div>
        <div>{{ location }}</div>
      </div>
    </TooltipContributor>
    <!-- TODO: v-show should be used instead of v-if to avoid destroying child state -->
    <div v-if="expanded" class="inner">
      <div v-if="places === null">Loading...</div>
      <div v-if="places !== null">
        <NamedPlace
          class="place"
          v-for="place in places"
          :key="place.name"
          :place="place"
          :value="values.get(place.id) ?? null"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.wrapper {
  min-width: 200px;
  border: solid 1px #000000;
  border-top: 0;

  &:first-child {
    border-top: solid 1px #000000;
  }
}

.header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  color: #000000;
  padding: 5px;
  background-color: #9de19a;

  &.top-frame {
    background-color: #38ac69;
    .name {
      font-weight: bold;
    }
  }

  &:hover {
    cursor: pointer;
    box-shadow: inset 0 0 1px 1px rgb(76, 76, 76);
  }
}

.inner {
  background: #ffffff;
  border-top: solid 1px #000000;
  padding: 5px;
}
</style>
