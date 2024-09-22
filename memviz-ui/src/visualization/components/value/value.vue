<script setup lang="ts">
import type { TyScalar, Value } from "../../formatting";
import { Type, TyArray, TyPtr } from "process-def";
import { Path } from "../../pointers/path";
import { componentMap } from "../../store";
import { watch } from "vue";

import Array from "./array.vue";
import Pointer from "./pointer.vue";
import Scalar from "./scalar.vue";
import PtrTarget from "../ptrtarget.vue";

const props = defineProps<{
  value: Value<Type>;
  path: Path;
}>();

function isScalar(value: Value<Type>): value is Value<TyScalar> {
  return (
    value.type.kind === "bool" ||
    value.type.kind === "int" ||
    value.type.kind === "float"
  );
}

function isArray(value: Value<Type>): value is Value<TyArray> {
  return value.type.kind === "array";
}

function isPtr(value: Value<Type>): value is Value<TyPtr> {
  return value.type.kind === "ptr";
}
</script>

<template>
  <PtrTarget :value="value">
    <div class="value">
      <Scalar v-if="isScalar(value)" :path="path" :value="value"></Scalar>
      <Array v-else-if="isArray(value)" :path="path" :value="value"></Array>
      <Pointer v-else-if="isPtr(value)" :path="path" :value="value"></Pointer>
      <div v-else>&lt;value of type {{ value.type.name }}&gt;</div>
    </div>
  </PtrTarget>
</template>
