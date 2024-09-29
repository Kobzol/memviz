<script setup lang="ts">
import { type Ref, computed, shallowRef, watch } from "vue";
import { appState } from "../../../store";
import { Address } from "process-def";
import { loadCString } from "../../../utils/string";

const props = defineProps<{
  address: Address;
}>();

async function loadData() {
  stringBuffer.value = await loadCString(resolver.value, props.address);
}

const resolver = computed(() => appState.value.resolver);

const stringBuffer: Ref<ArrayBuffer | null> = shallowRef(null);
const stringAsText = computed(() => {
  if (stringBuffer.value === null) return null;
  return new TextDecoder().decode(stringBuffer.value);
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
  <div>
    <code v-if="stringBuffer !== null">{{ stringFormatted }}</code>
  </div>
</template>
