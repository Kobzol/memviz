<script setup lang="ts">
import type { TyScalar, Value } from "../../value";
import { Type, TyArray } from "process-def";
import Scalar from "./scalar.vue";
import Array from "./array.vue";
import { Path } from "../../path";

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
</script>

<template>
  <div class="value">
    <Scalar v-if="isScalar(value)" :path="path" :value="value"></Scalar>
    <Array v-else-if="isArray(value)" :path="path" :value="value"></Array>
    <div v-else>&lt;value&gt;</div>
  </div>
</template>

<style scoped lang="scss"></style>
