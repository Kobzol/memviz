<script setup lang="ts">
import type { Place, StackFrame } from "process-def";
import { computed, ref, watch } from "vue";
import type { Ref } from "vue";
import { addressToStr, strToAddress } from "../../utils";
import { appState } from "../store";
import NamedPlace from "./namedplace.vue";
import { formatLocation } from "../utils/formatting";
import TooltipContributor from "./tooltip/tooltip-contributor.vue";

const props = defineProps<{
  frame: StackFrame;
}>();

function toggleExpanded() {
  expanded.value = !expanded.value;
}

// TODO: deduplicate loading
async function maybeLoadPlaces() {
  if (expanded.value && places.value === null) {
    const framePlaces = await resolver.value.getPlaces(props.frame.index);
    // Preload stack data
    const placesByAddress = framePlaces
      .filter((p) => p.address !== null)
      .sort((a, b) => {
        const addrA = strToAddress(a.address!);
        const addrB = strToAddress(b.address!);
        if (addrA > addrB) return 1;
        if (addrA < addrB) return -1;
        return 0;
      });

    if (placesByAddress.length > 0) {
      const start = strToAddress(placesByAddress[0].address!);
      const lastPlace = placesByAddress[placesByAddress.length - 1];
      const end =
        strToAddress(lastPlace.address!) + BigInt(lastPlace.type.size);
      const size = end - start;
      // Pre-cache the memory of the stack frame in a single batch, to avoid many requests
      // for the individual stack places
      await resolver.value.readMemory(addressToStr(start), Number(size));
    }
    places.value = framePlaces;
  }
}

const resolver = computed(() => appState.value.resolver);
const expanded = ref(props.frame.index === 0);
const places: Ref<Place[] | null> = ref(null);

const location = computed(() =>
  formatLocation(props.frame.file, props.frame.line)
);
const tooltip = computed(() => {
  return `Stack frame of function <b>${props.frame.name}</b> located at <b>${location.value}</b>`;
});
const isTopFrame = computed(() => props.frame.index === 0);

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
  <div class="wrapper">
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
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.wrapper {
  min-width: 200px;
  max-width: 500px;
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
