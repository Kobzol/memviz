<script setup lang="ts">
import { type Ref, computed, nextTick, ref, shallowRef, watch } from "vue";
import { addressToStr } from "../../../utils";
import { appState, notifyComponentMap } from "../../store";
import {
  TyScalar,
  type Value,
  formatAddress,
  scalarAsString,
} from "../../formatting";
import { Path } from "../../pointers/path";
import ByteArray from "./bytearray.vue";

const props = defineProps<{
  value: Value<TyScalar>;
  path: Path;
}>();

enum DisplayMode {
  String = "string",
  ByteArray = "per-byte",
}

async function loadData() {
  const address = props.value.address;
  if (address === null) {
    return;
  }

  buffer.value = await resolver.value.readMemory(
    addressToStr(address),
    props.value.type.size
  );
  // await nextTick();
  // notifyComponentMap();
}

function toggleDisplayMode() {
  if (displayMode.value === DisplayMode.String) {
    displayMode.value = DisplayMode.ByteArray;
  } else if (displayMode.value === DisplayMode.ByteArray) {
    displayMode.value = DisplayMode.String;
  }
}

const resolver = computed(() => appState.value.resolver);
const displayMode = ref(DisplayMode.String);

const buffer: Ref<ArrayBuffer | null> = shallowRef(null);
const bufferAsString = computed(() => {
  if (buffer.value === null) return "";
  return scalarAsString(buffer.value, props.value.type);
});

const title = computed(() => {
  return `${bufferAsString.value} at address ${formatAddress(
    props.value.address
  )}`;
});

watch(
  () => [props.value, resolver.value],
  () => loadData(),
  { immediate: true }
);
</script>

<template>
  <div class="scalar" @click="toggleDisplayMode" :title="title">
    <template v-if="buffer !== null">
      <span class="string" v-if="displayMode === DisplayMode.String">
        {{ bufferAsString }}
      </span>
      <ByteArray v-else :buffer="buffer"></ByteArray>
    </template>
  </div>
</template>

<style scoped lang="scss">
.scalar {
  display: flex;
  justify-content: end;
  padding: 0px 5px;

  &:hover {
    cursor: pointer;
    background-color: #dddddd;
  }
}

.string {
  padding: 1px 0;
}
</style>
