<script setup lang="ts">
import type { TyScalar, Value } from "../../formatting";
import { Type, TyArray, TyPtr } from "process-def";
import { Path } from "../../path";
import { pointerTargets } from "../../store";
import { watch } from "vue";

import Array from "./array.vue";
import Pointer from "./pointer.vue";
import Scalar from "./scalar.vue";

const props = defineProps<{
  value: Value<Type>;
  path: Path;
}>();

function isScalar(value: Value<Type>): value is Value<TyScalar> {
  return value.type.kind === "bool" || value.type.kind === "int" || value.type.kind === "float";
}

function isArray(value: Value<Type>): value is Value<TyArray> {
  return value.type.kind === "array";
}

function isPtr(value: Value<Type>): value is Value<TyPtr> {
  return value.type.kind === "ptr";
}

watch(pointerTargets, (a, b) => {
  console.log("POINTER TARGETS CHANGED", a, b);
});
</script>

<template>
  <div class="value">
    <Scalar v-if="isScalar(value)" :path="path" :value="value"></Scalar>
    <Array v-else-if="isArray(value)" :path="path" :value="value"></Array>
    <Pointer v-else-if="isPtr(value)" :path="path" :value="value"></Pointer>
    <div v-else>&lt;value&gt;</div>
  </div>
</template>

<style scoped lang="scss"></style>
