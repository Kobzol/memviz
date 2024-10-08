<script setup lang="ts">
import { type Ref, computed, ref, shallowRef, watch } from "vue";
import { addressToStr } from "../../../utils";
import { appState } from "../../store";
import {
  formatAddress,
  formatTypeSize,
  scalarAsString,
} from "../../utils/formatting";
import { Path } from "../../pointers/path";
import ByteArray from "./byte-array.vue";
import { TyScalar } from "../../utils/types";
import TooltipContributor from "../tooltip/tooltip-contributor.vue";
import PtrTarget from "../ptr-target.vue";
import { Value, valueToRegion } from "../../utils/value";

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

const buffer: Ref<ArrayBuffer | null> = shallowRef(null);
const bufferAsString = computed(() => {
  if (buffer.value === null) return "";
  return scalarAsString(buffer.value, props.value.type);
});

const tooltip = computed(() => {
  return `Value \`${bufferAsString.value}\` (${formatTypeSize(
    props.value.type
  )}) at ${formatAddress(props.value.address)}`;
});

watch(
  () => [props.value, resolver.value],
  () => loadData(),
  { immediate: true }
);
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <div class="scalar" @click="toggleDisplayMode">
      <template v-if="buffer !== null">
        <PtrTarget
          v-if="displayMode === DisplayMode.String"
          :path="path"
          :region="valueToRegion(value)"
        >
          <code class="string">
            {{ bufferAsString }}
          </code>
        </PtrTarget>
        <ByteArray
          v-else
          :buffer="buffer"
          :region="valueToRegion(value)"
          :path="path"
        ></ByteArray>
      </template>
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.scalar {
  display: flex;
  justify-content: end;
  padding: 0px 5px;
  font-family: monospace;
  font-size: 1.2em;

  &:hover {
    cursor: pointer;
  }
}

.string {
  padding: 1px 0;
}
</style>
