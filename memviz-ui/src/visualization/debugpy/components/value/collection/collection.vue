<script setup lang="ts">
import { computed } from "vue";
import SequenceCollection from "./sequence-collection.vue";
import SetCollection from "./set-collection.vue";
import { appState } from "../../../../store";
import {
  CollectionVal,
  DeferredFrozenSetVal,
  DeferredListVal,
  DeferredSetVal,
  DeferredTupleVal,
} from "process-def/debugpy";
import { inject } from "vue";

const props = defineProps<{
  value: CollectionVal;
}>();

const frameIndex = inject<null | number>("frameIndex", null);

async function loadData() {
  if (Object.keys(props.value.elements).length >= props.value.element_count) {
    // empty or already loaded
    return;
  }
  if (frameIndex === null) {
    console.warn(
      "No frame index provided for collection, cannot load elements"
    );
    return;
  }
  resolver.value
    .getCollectionElements(
      props.value.id,
      frameIndex,
      0,
      props.value.element_count
    )
    .then((loadedElements) => {
      props.value.elements = loadedElements;
    });
}

const resolver = computed(() => appState.value.resolver);

async function onClick() {
  await loadData();
}

function hasResolvedElements() {
  return Object.keys(props.value.elements).length > 0;
}

function isSequenceCollection(
  value: CollectionVal
): value is DeferredListVal | DeferredTupleVal {
  return value.kind === "list" || value.kind === "tuple";
}

function isSetCollection(
  value: CollectionVal
): value is DeferredSetVal | DeferredFrozenSetVal {
  return value.kind === "set" || value.kind === "frozenset";
}
</script>

<template>
  <div v-if="value.element_count > 0" class="collection">
    <div v-if="hasResolvedElements()">
      <SequenceCollection v-if="isSequenceCollection(value)" :value="value" />
      <SetCollection v-else-if="isSetCollection(value)" :value="value" />
      <div v-else>Unsupported collection type: {{ value.kind }}</div>
    </div>
    <div v-else @click="onClick" class="not-resolved">...</div>
  </div>
</template>

<style scoped lang="scss">
.collection {
  .not-resolved {
    &:hover {
      cursor: pointer;
    }
  }
}
</style>
