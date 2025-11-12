<script setup lang="ts">
import { type Ref, computed, ref, watch } from "vue";
import { appState } from "../../../store";
import { DeferredStrVal, Value } from "process-def/debugpy";
import { inject } from "vue";

const props = defineProps<{
  value: DeferredStrVal;
}>();

const frameIndex = inject<null | number>("frameIndex", null);

// async function loadData() {
//   if (frameIndex === null) {
//     console.warn("No frame index provided for str, cannot load elements");
//     return;
//   }
//   if (!props.value.length) {
//     stringContents.value = "";
//     return;
//   }
//   resolver.value
//     .getStringContents(props.value.id, frameIndex, 0, props.value.length)
//     .then((loadedString) => {
//       console.log("Loaded string:", loadedString);
//       stringContents.value = loadedString;
//     });
// }

// const resolver = computed(() => appState.value.resolver);
const stringContents = computed(() => {
  if (!props.value.content) {
    return "";
  }
  const keys = Object.keys(props.value.content)
    .map((k) => parseInt(k))
    .sort((a, b) => a - b);
  return keys.map((k) => props.value.content[k]).join("");
});
</script>

<template>
  <div class="str">
    <code v-if="stringContents" class="string">
      {{ stringContents }}
    </code>
  </div>
</template>

<style scoped lang="scss">
.str {
  display: flex;
  justify-content: end;
  padding: 0px 5px;
  font-family: monospace;
  font-size: 1.2em;

  &:hover {
    cursor: pointer;
  }
}
</style>
