<script setup lang="ts">
import { ref } from "vue";
import { Path } from "../../../pointers/path";
import { TyCharArray } from "../../../utils/types";
import String from "./string.vue";
import Array from "../array/array.vue";
import PtrTarget from "../../ptrtarget.vue";
import { Value, valueToRegion } from "../../../utils/value";

const props = defineProps<{
  value: Value<TyCharArray>;
  path: Path;
}>();

enum DisplayMode {
  String = "string",
  Array = "array",
}

function toggleDisplayMode() {
  if (displayMode.value === DisplayMode.String) {
    displayMode.value = DisplayMode.Array;
  } else if (displayMode.value === DisplayMode.Array) {
    displayMode.value = DisplayMode.String;
  }
}

const displayMode = ref(DisplayMode.String);
</script>

<template>
  <div class="wrapper" @click="toggleDisplayMode">
    <PtrTarget
      v-if="displayMode === DisplayMode.String && props.value.address !== null"
      :region="valueToRegion(value)"
      :path="path"
    >
      <String :address="props.value.address" />
    </PtrTarget>
    <Array v-else :path="path" :value="value"></Array>
  </div>
</template>

<style scoped lang="scss">
.wrapper {
  cursor: pointer;
}
</style>
