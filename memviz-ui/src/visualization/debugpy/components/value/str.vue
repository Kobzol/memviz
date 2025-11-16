<script setup lang="ts">
import { computed } from "vue";
import { appState } from "../../../store";
import { DeferredStrVal } from "process-def/debugpy";
import { inject } from "vue";
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";

const props = defineProps<{
  value: DeferredStrVal;
}>();

const frameIndex = inject<null | number>("frameIndex", null);

async function loadData() {
  if (frameIndex === null) {
    console.warn("No frame index provided for str, cannot load elements");
    return;
  }
  if (!props.value.length) {
    return;
  }
  const start = 0;
  const length = props.value.length;
  resolver.value
    .getStringContents(props.value.id, frameIndex, start, length)
    .then((resStr) => {
      for (let i = 0; i < resStr.length; i++) {
        props.value.content[start + i] = resStr[i];
      }
    });
}

const resolver = computed(() => appState.value.resolver);

const stringContents = computed(() => {
  if (!props.value.content) {
    return "";
  }
  const keys = Object.keys(props.value.content)
    .map((k) => parseInt(k))
    .sort((a, b) => a - b);
  return keys.map((k) => props.value.content[k]).join("");
});

const tooltip = computed(() => {
  return `Id: <b>${props.value.id}</b>`;
});

function onClick() {
  loadData();
}

function hasResolvedContent() {
  return Object.keys(props.value.content).length >= props.value.length;
}
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <div class="str">
      <code v-if="hasResolvedContent()" class="string">
        {{ stringContents }}
      </code>
      <code v-else class="string" @click="onClick"> ... </code>
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.str {
  display: flex;
  justify-content: start;
  font-family: monospace;
  font-size: 1.2em;

  &:hover {
    cursor: pointer;
  }
}
</style>
