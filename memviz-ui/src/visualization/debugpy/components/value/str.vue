<script setup lang="ts">
import { computed } from "vue";
import { processResolver } from "../../../store";
import { DeferredStrVal } from "process-def/debugpy";
import TooltipContributor from "../../../components/tooltip/tooltip-contributor.vue";

const props = defineProps<{
  value: DeferredStrVal;
}>();

async function loadData() {
  if (!props.value.length) {
    return;
  }
  if (hasResolvedContent()) {
    return;
  }
  const start = 0;
  const length = props.value.length;
  resolver.value.debugpy
    .getStringContents(props.value.id, start, length)
    .then((resStr) => {
      for (let i = 0; i < resStr.length; i++) {
        props.value.content[start + i] = resStr[i];
      }
    });
}

const resolver = computed(() => processResolver.value);

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
  return `Id: <b>${props.value.id}</b>, size: <b>${props.value.size} B</b>`;
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
      <code v-else class="not-resolved" @click="onClick"> ... </code>
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.str {
  display: flex;
  justify-content: start;
  font-family: monospace;
  font-size: 1.2em;

  .not-resolved {
    &:hover {
      cursor: pointer;
    }
  }
}
</style>
