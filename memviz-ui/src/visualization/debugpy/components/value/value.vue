<script setup lang="ts">
import None from "./none.vue";
import Scalar from "./scalar.vue";
import Complex from "./complex.vue";
import Str from "./str.vue";
import Collection from "./collection.vue";
import Dict from "./dict.vue";
import ObjectComponent from "./object.vue";
import type {
  DeferredStrVal,
  NoneVal,
  ComplexVal,
  Value,
  DeferredDictVal,
  RangeVal,
  DeferredObjectVal,
  FunctionVal,
} from "process-def/debugpy";
import {
  type ScalarVal,
  isScalarType,
  isCollectionType,
  CollectionVal,
} from "../../utils/types";
import { PropType } from "vue";

const props = defineProps({
  value: {
    type: Object as PropType<Value>,
    required: true,
  },
  level: {
    type: Number,
    default: 0,
  },
});

function isNone(value: Value): value is NoneVal {
  return value.kind === "none";
}

function isScalar(value: Value): value is ScalarVal {
  return isScalarType(value);
}

function isComplex(value: Value): value is ComplexVal {
  return value.kind === "complex";
}

function isStr(value: Value): value is DeferredStrVal {
  return value.kind === "defStr";
}

function isCollection(value: Value): value is CollectionVal {
  return isCollectionType(value);
}

function isDictType(value: Value): value is DeferredDictVal {
  return value.kind === "defDict";
}

function isRangeVal(value: Value): value is RangeVal {
  return value.kind === "rangeVal";
}

function isFunctionVal(value: Value): value is FunctionVal {
  return value.kind === "function";
}

function isObjectVal(value: Value): value is DeferredObjectVal {
  return value.kind === "defObject";
}
</script>

<template>
  <div class="value" :style="{ marginLeft: `${level * 30}px` }">
    <None v-if="isNone(value)" :value="value as NoneVal" />
    <Scalar v-else-if="isScalar(value)" :value="value as ScalarVal" />
    <Complex v-else-if="isComplex(value)" :value="value as ComplexVal" />
    <Str v-else-if="isStr(value)" :value="value as DeferredStrVal" />
    <Collection
      v-else-if="isCollection(value)"
      :value="value as CollectionVal"
      :level="level"
    />
    <Dict
      v-else-if="isDictType(value)"
      :value="value as DeferredDictVal"
      :level="level"
    />
    <ObjectComponent
      v-else-if="isObjectVal(value)"
      :value="value as DeferredObjectVal"
      :level="level"
    />
    <div>&lt;value of type {{ value.kind }}&gt;</div>
  </div>
</template>

<style scoped lang="scss">
.value {
  border: 1px solid #a4c5ea;
}
</style>
