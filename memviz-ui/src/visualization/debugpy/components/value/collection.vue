<script setup lang="ts">
import { computed } from "vue";
import ValueComponent from "./value.vue";
import { appState } from "../../../store";
import { CollectionVal } from "process-def/debugpy";
import { inject } from "vue";

const props = defineProps<{
  value: CollectionVal;
  level: number;
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
</script>

<template>
  <div class="sequence" @click="onClick">
    {{ props.value.kind }} [{{ props.value.element_count }}]
    <ValueComponent
      v-for="(el, index) in props.value.elements"
      class="value"
      :key="index"
      :value="el"
      :level="props.level + 1"
    />
  </div>
</template>

<style scoped lang="scss">
.sequence {
  display: flex;
  justify-content: end;
  padding: 0px 5px;
  flex-direction: column;

  &:hover {
    cursor: pointer;
  }
}

.value {
  margin-left: 5px;
}

.string {
  padding: 1px 0;
}
</style>
