<script setup lang="ts">
import { type Ref, computed, ref } from "vue";
import ValueComponent from "./value.vue";
import { appState } from "../../../store";
import { CollectionVal, Value } from "process-def/debugpy";
import { inject } from "vue";

const props = defineProps<{
  value: CollectionVal;
  level: number;
}>();

const frameIndex = inject<null | number>("frameIndex", null);

// async function loadData() {
//   if (frameIndex === null) {
//     console.warn(
//       "No frame index provided for collection, cannot load elements"
//     );
//     return;
//   }
//   if (props.value.element_count === 0) {
//     elements.value = [];
//     return;
//   }
//   resolver.value
//     .getCollectionElements(
//       props.value.id,
//       frameIndex,
//       0,
//       props.value.element_count
//     )
//     .then((loadedElements) => {
//       elements.value = loadedElements;
//     });
// }

// const resolver = computed(() => appState.value.resolver);
</script>

<template>
  <div class="sequence">
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
