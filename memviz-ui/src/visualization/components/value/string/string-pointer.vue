<script setup lang="ts">
import { type Ref, computed, ref, shallowRef, watch } from "vue";
import { addressToStr } from "../../../../utils";
import { appState } from "../../../store";
import {
  bufferAsBigUnsignedInt,
  formatAddress,
} from "../../../utils/formatting";
import { Path } from "../../../pointers/path";
import { TyStringPtr } from "../../../utils/types";
import { Address } from "process-def";
import String from "./string.vue";
import Pointer from "../pointer.vue";
import TooltipContributor from "../../tooltip/tooltip-contributor.vue";
import { Value, valueToRegion } from "../../../utils/value";
import PtrTarget from "../../ptr-target.vue";

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
  return bufferAsBigUnsignedInt(ptrBuffer.value, props.value.type.size);
});

const tooltip = computed(() => {
  return `String pointer pointing to \`${ptrFormatted.value}\``;
});

watch(
  () => [props.value, resolver.value],
  () => loadData(),
  { immediate: true }
);
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <div class="wrapper" @click="toggleDisplayMode">
      <template v-if="ptrBuffer !== null">
        <PtrTarget
          v-if="displayMode === DisplayMode.String && ptrAsAddress !== null"
          :region="valueToRegion(value)"
          :path="path"
        >
          <String :address="ptrAsAddress" />
        </PtrTarget>
        <Pointer v-else :value="value" :path="path" />
      </template>
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.wrapper {
  cursor: pointer;
}
</style>
