<script setup lang="ts">
import { type Ref, computed, onMounted, ref, watch, watchEffect } from "vue";
import { addressToStr } from "../../../utils";
import { appState } from "../../store";
import {
  TyScalar,
  type Value,
  formatAddress,
  scalarAsString,
} from "../../formatting";
import { Path } from "../../path";
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

const buffer: Ref<ArrayBuffer | null> = ref(null);
const bufferAsString = computed(() => {
  if (buffer.value === null) return "";
  return scalarAsString(buffer.value, props.value.type);
});

const title = computed(() => {
  return `${bufferAsString.value} at address ${formatAddress(
    props.value.address
  )}`;
});

const elementRef = ref<HTMLDivElement | null>(null);

watchEffect(() => loadData());
onMounted(() => {
  console.log(
    "GOT HTML REF",
    elementRef.value,
    elementRef.value?.getBoundingClientRect()
  );
});
</script>

<template>
  <div
    class="scalar"
    @click="toggleDisplayMode"
    :title="title"
    :ref="(el: any) => elementRef = el"
  >
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
