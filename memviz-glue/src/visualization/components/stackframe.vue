<script setup lang="ts">
import type { Place, StackFrame } from "process-def";
import { computed, ref, watch } from "vue";
import type { Ref } from "vue";
import { appState } from "../store";
import NamedPlace from "./namedplace.vue";
import { addressToStr, measureAsync, strToAddress } from "../../utils";

const props = defineProps<{
  frame: StackFrame;
}>();

function toggleExpanded() {
  expanded.value = !expanded.value;
}

// TODO: deduplicate loading
async function maybeLoadPlaces() {
  if (expanded.value && places.value === null) {
    const framePlaces = await measureAsync("loadPlaces", async () => resolver.value.getPlaces(props.frame.index));
    // Preload stack data
    const placesByAddress = framePlaces.filter(p => p.address !== null)
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
      const end = strToAddress(lastPlace.address!) + BigInt(lastPlace.type.size);
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

const location = computed(() => {
  let file = props.frame.file;
  if (file?.includes("/")) {
    const segments = file.split("/");
    file = segments[segments.length - 1];
  }
  return `${file ?? "<unknown-file>"}:${props.frame.line}`;
});
const title = computed(() => {
  return `Stack frame (function ${props.frame.name}, ${location.value})`;
});

watch(() => [props.frame, resolver], () => {
  places.value = null;
  maybeLoadPlaces();
});

watch(expanded, () => {
  maybeLoadPlaces();
}, { immediate: true });

// https://www.color-hex.com/color-palette/24003
</script>

<template>
  <div class="wrapper">
    <div class="header" :title="title" @click="toggleExpanded">{{ props.frame.name }} ({{ location }})</div>
    <div v-if="expanded" class="inner">
      <div v-if="places === null">Loading...</div>
      <div v-else>
        <NamedPlace class="place" v-for="place in places" :key="place.name" :place="place" />
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
  color: #000000;
  padding: 5px;
  background-color: #9DE19A;

  &:hover {
    background-color: #73FF6D;
  }
}

.inner {
  background: #FFFFFF;
  border-top: solid 1px #000000;
}
</style>
