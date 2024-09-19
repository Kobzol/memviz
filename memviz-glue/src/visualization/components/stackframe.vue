<script setup lang="ts">
import type { Place, StackFrame } from "process-def";
import { computed, Ref, ref, watch } from "vue";
import { appState } from "../store";
import NamedPlace from "./namedplace.vue";
import { withLoading } from "../utils";

const props = defineProps<{
  frame: StackFrame;
}>();

function toggleExpanded() {
  expanded.value = !expanded.value;
  maybeLoadPlaces();
}

// TODO: deduplicate loading
async function maybeLoadPlaces() {
  if (expanded) {
    places.value = await withLoading(loading, () => resolver.value.getPlaces(props.frame.index));
  }
}

const resolver = computed(() => appState.value.resolver);
const expanded = ref(props.frame.index === 0);
const places: Ref<Place[] | null> = ref(null);
const loading = ref(false);

if (expanded.value) {
  maybeLoadPlaces();
}

const location = computed(() => {
  return `${props.frame.file ?? "<unknown-file>"}:${props.frame.line}`;
});
const title = computed(() => {
  return `Stack frame (function ${props.frame.name}, ${location})`;
});

watch(props.frame, () => {
  console.log("frame changed");
})
watch(resolver, () => {
  console.log("resolver changed");
});
// https://www.color-hex.com/color-palette/24003
</script>

<template>
  <div class="wrapper">
    <div class="header" :title="title" @click="toggleExpanded">{{ props.frame.name }} ({{ location }})</div>
    <div v-if="expanded" class="inner">
      <div v-if="loading">Loading...</div>
      <div v-else>
        <NamedPlace class="place" v-for="place in places" :place="place" />
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
