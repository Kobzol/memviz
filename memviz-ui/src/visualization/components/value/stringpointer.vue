<script setup lang="ts">
import { type Ref, computed, nextTick, ref, shallowRef, watch } from "vue";
import { addressToStr } from "../../../utils";
import { appState, notifyComponentMap } from "../../store";
import {
  type Value,
  bufferToHexadecimal,
  formatAddress,
  formatTypeSize,
  scalarAsString,
} from "../../utils/formatting";
import { Path } from "../../pointers/path";
import ByteArray from "./bytearray.vue";
import { TyStringPtr } from "../../utils/types";

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
}

function toggleDisplayMode() {
  if (displayMode.value === DisplayMode.String) {
    displayMode.value = DisplayMode.Pointer;
  } else if (displayMode.value === DisplayMode.Pointer) {
    displayMode.value = DisplayMode.String;
  }
}

const resolver = computed(() => appState.value.resolver);
const displayMode = ref(DisplayMode.Pointer);

const ptrBuffer: Ref<ArrayBuffer | null> = shallowRef(null);
const ptrAsHexadecimal = computed(() => {
  if (ptrBuffer.value === null) return "";
  return bufferToHexadecimal(ptrBuffer.value);
});

const title = computed(() => {
  return `String pointer pointing to \`${ptrAsHexadecimal.value}\``;
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
      <code class="string" v-if="displayMode === DisplayMode.String">
        string
      </code>
      <div v-else>{{ ptrAsHexadecimal }}</div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.wrapper {
  cursor: pointer;
}
</style>
