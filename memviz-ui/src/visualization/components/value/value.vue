<script setup lang="ts">
import { Type, TyArray, TyPtr, TyEnum, TyStruct } from "process-def";
import { Path } from "../../pointers/path";
import {
  isCharType,
  isScalarType,
  TyCharArray,
  TyScalar,
  TyStringPtr,
} from "../../utils/types";
import { Value } from "../../utils/value";

import Array from "./array/array.vue";
import Structure from "./structure/structure.vue";
import Pointer from "./pointer.vue";
import Scalar from "./scalar.vue";
import StringPointer from "./string/string-pointer.vue";
import CharArray from "./string/char-array.vue";
import Enum from "./enum.vue";

const props = defineProps<{
  value: Value<Type>;
  path: Path;
}>();

function isScalar(value: Value<Type>): value is Value<TyScalar> {
  return isScalarType(value.type);
}

function isArray(value: Value<Type>): value is Value<TyArray> {
  return value.type.kind === "array";
}

function isStruct(value: Value<Type>): value is Value<TyStruct> {
  return value.type.kind === "struct";
}

function isPtr(value: Value<Type>): value is Value<TyPtr> {
  return value.type.kind === "ptr";
}

function isStringPtr(value: Value<Type>): value is Value<TyStringPtr> {
  if (!isPtr(value)) return false;
  return isCharType(value.type.target);
}

function isCharArray(value: Value<Type>): value is Value<TyCharArray> {
  if (!isArray(value)) return false;
  return isCharType(value.type.type);
}

function isEnum(value: Value<Type>): value is Value<TyEnum> {
  return value.type.kind === "enum";
}
</script>

<template>
  <div>
    <div v-if="value.address === null">&lt;missing address&gt;</div>
    <Scalar v-else-if="isScalar(value)" :path="path" :value="value" />
    <StringPointer v-else-if="isStringPtr(value)" :path="path" :value="value" />
    <Pointer v-else-if="isPtr(value)" :path="path" :value="value" />
    <Structure v-else-if="isStruct(value)" :path="path" :value="value" />
    <CharArray v-else-if="isCharArray(value)" :path="path" :value="value" />
    <Array v-else-if="isArray(value)" :path="path" :value="value" />
    <Enum v-else-if="isEnum(value)" :path="path" :value="value" />
    <div v-else>&lt;value of type {{ value.type.name }}&gt;</div>
  </div>
</template>
