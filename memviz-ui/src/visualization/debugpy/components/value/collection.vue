<script setup lang="ts">
import { type Ref, computed, ref, watch } from "vue";
import ValueComponent from "./value.vue";
import { appState } from "../../../store";
import { CollectionVal } from "../../utils/types";
import { Value } from "process-def/debugpy";
import { inject } from "vue";

const props = defineProps<{
  value: CollectionVal;
  level: number;
}>();

async function loadData() {
  const frameIndex = inject<null | number>("frameIndex", null);
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
      elements.value = loadedElements;
    });
}

const resolver = computed(() => appState.value.resolver);
const elements: Ref<Value[] | null> = ref(null);

watch(
  () => [props.value, resolver.value],
  () => loadData(),
  { immediate: true }
);
</script>

<template>
  <div class="sequence">
    <ValueComponent
      v-for="(el, index) in elements"
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
