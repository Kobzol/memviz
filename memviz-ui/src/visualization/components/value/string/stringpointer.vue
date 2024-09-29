<script setup lang="ts">
import { type Ref, computed, ref, shallowRef, watch } from "vue";
import { addressToStr } from "../../../../utils";
import { appState } from "../../../store";
import {
  type Value,
  bufferAsBigInt,
  bufferToHexadecimal,
  formatAddress,
} from "../../../utils/formatting";
import { Path } from "../../../pointers/path";
import { TyStringPtr } from "../../../utils/types";
import { Address } from "process-def";
import String from "./string.vue";
import Pointer from "../pointer.vue";

const props = defineProps<{
  value: Value<TyStringPtr>;
  path: Path;
}>();

enum DisplayMode {
  String = "string",
  Pointer = "pointer",
}

async function loadData() {
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
const displayMode = ref(DisplayMode.String);

const ptrBuffer: Ref<ArrayBuffer | null> = shallowRef(null);
const ptrFormatted = computed(() => {
  if (ptrAsAddress.value === null) return "";
  return formatAddress(ptrAsAddress.value);
});
const ptrAsAddress = computed((): Address | null => {
  if (ptrBuffer.value === null) return null;
  return bufferAsBigInt(ptrBuffer.value, props.value.type.size);
});

const title = computed(() => {
  return `String pointer pointing to \`${ptrFormatted.value}\``;
});

watch(
  () => [props.value, resolver.value],
  () => loadData(),
  { immediate: true }
);
</script>

<template>
  <div class="wrapper" @click="toggleDisplayMode" v-tippy="title">
    <template v-if="ptrBuffer !== null">
      <String
        v-if="displayMode === DisplayMode.String && ptrAsAddress !== null"
        :address="ptrAsAddress"
      />
      <Pointer v-else :value="value" :path="path" />
    </template>
  </div>
</template>

<style scoped lang="scss">
.wrapper {
  cursor: pointer;
}
</style>
