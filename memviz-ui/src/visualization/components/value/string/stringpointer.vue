<script setup lang="ts">
import { type Ref, computed, ref, shallowRef, watch } from "vue";
import { addressToStr } from "../../../../utils";
import { appState } from "../../../store";
import {
  type Value,
  bufferAsBigInt,
  bufferToHexadecimal,
  pluralize,
} from "../../../utils/formatting";
import { Path } from "../../../pointers/path";
import { TyStringPtr } from "../../../utils/types";
import { Address } from "process-def";
import { loadCString } from "../../../utils/string";

const props = defineProps<{
  value: Value<TyStringPtr>;
  path: Path;
}>();

enum DisplayMode {
  String = "string",
  Pointer = "pointer",
}

async function loadPointerContents() {
  const address = props.value.address;
  if (address === null) {
    return;
  }

  ptrBuffer.value = await resolver.value.readMemory(
    addressToStr(address),
    props.value.type.size
  );
  loadStringContents();
}

async function loadStringContents() {
  if (displayMode.value !== DisplayMode.String) return;

  const target = ptrAsAddress.value;
  if (target === null) {
    return;
  }

  // Try to load the contents of the string itself
  stringBuffer.value = await loadCString(resolver.value, target);
}

function toggleDisplayMode() {
  if (displayMode.value === DisplayMode.String) {
    displayMode.value = DisplayMode.Pointer;
  } else if (displayMode.value === DisplayMode.Pointer) {
    displayMode.value = DisplayMode.String;
  }
  loadStringContents();
}

const resolver = computed(() => appState.value.resolver);
const displayMode = ref(DisplayMode.String);

const ptrBuffer: Ref<ArrayBuffer | null> = shallowRef(null);
const ptrAsHexadecimal = computed(() => {
  if (ptrBuffer.value === null) return "";
  return bufferToHexadecimal(ptrBuffer.value);
});
const ptrAsAddress = computed((): Address | null => {
  if (ptrBuffer.value === null) return null;
  return bufferAsBigInt(ptrBuffer.value, props.value.type.size);
});

const stringBuffer: Ref<ArrayBuffer | null> = shallowRef(null);
const stringAsText = computed(() => {
  if (stringBuffer.value === null) return null;
  return new TextDecoder().decode(stringBuffer.value);
});
const stringFormatted = computed(() => {
  if (stringAsText.value === null) return "";
  return `"${stringAsText.value}"`;
});

const title = computed(() => {
  let title = `String pointer pointing to \`${ptrAsHexadecimal.value}\``;
  const str = stringAsText.value;
  if (str !== null) {
    title += ` (${str.length} ${pluralize("character", str.length)})`;
  }
  return title;
});

watch(
  () => [props.value, resolver.value],
  () => loadPointerContents(),
  { immediate: true }
);
</script>

<template>
  <div class="wrapper" @click="toggleDisplayMode" v-tippy="title">
    <template v-if="ptrBuffer !== null">
      <div class="string" v-if="displayMode === DisplayMode.String">
        <code v-if="stringBuffer !== null">{{ stringFormatted }}</code>
      </div>
      <div v-else>{{ ptrAsHexadecimal }}</div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.wrapper {
  cursor: pointer;
}
</style>
