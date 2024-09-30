<script setup lang="ts">
import { type Ref, computed, shallowRef, watch } from "vue";
import { appState } from "../../../store";
import { Address } from "process-def";
import { CStringLoadResult, loadCString } from "../../../utils/string";

const props = defineProps<{
  address: Address;
}>();

const MAX_DISPLAY = 100;

async function loadData() {
  const result = await loadCString(resolver.value, props.address, MAX_DISPLAY);
  loadedString.value = result;
}

const resolver = computed(() => appState.value.resolver);

const loadedString: Ref<CStringLoadResult | null> = shallowRef(null);
const stringAsText = computed(() => {
  if (loadedString.value === null) return null;
  return new TextDecoder().decode(loadedString.value.buffer);
});
const stringFormatted = computed(() => {
  if (stringAsText.value === null) return "";
  return `"${stringAsText.value}"`;
});

watch(
  () => [props.address, resolver.value],
  () => loadData(),
  { immediate: true }
);
</script>

<template>
  <div class="string">
    <code v-if="loadedString !== null">
      {{ stringFormatted }}
    </code>
    <template v-if="loadedString?.hasMore">…</template>
  </div>
</template>

<style lang="scss" scoped>
.string {
  word-break: break-all;
}
</style>
