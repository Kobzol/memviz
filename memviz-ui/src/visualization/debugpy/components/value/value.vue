<script setup lang="ts">
import None from "./none.vue";
import Scalar from "./scalar.vue";
import Complex from "./complex.vue";
import Str from "./str.vue";
import Collection from "./collection/collection.vue";
import Dict from "./dict.vue";
import Range from "./range.vue";
import FunctionComponent from "./function.vue";
import ObjectComponent from "./object/object.vue";
import ModuleComponent from "./module.vue";
import TypeComponent from "./type.vue";
import type {
  DeferredStrVal,
  NoneVal,
  ComplexVal,
  Value,
  DeferredDictVal,
  RangeVal,
  DeferredObjectVal,
  FunctionVal,
  ModuleVal,
  TypeVal,
  CollectionVal,
} from "process-def/debugpy";
import {
  type ScalarVal,
  isScalarType,
  isCollectionType,
} from "../../utils/types";
import { PropType } from "vue";

const props = defineProps({
  value: {
    type: Object as PropType<Value>,
    required: true,
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
  return value.kind === "str";
}

function isCollection(value: Value): value is CollectionVal {
  return isCollectionType(value);
}

function isDictType(value: Value): value is DeferredDictVal {
  return value.kind === "dict";
}

function isRangeVal(value: Value): value is RangeVal {
  return value.kind === "range";
}

function isFunctionVal(value: Value): value is FunctionVal {
  return value.kind === "function";
}

function isObjectVal(value: Value): value is DeferredObjectVal {
  return value.kind === "object" || value.kind === "deferred_object";
}

function isModuleVal(value: Value): value is ModuleVal {
  return value.kind === "module";
}

function isTypeVal(value: Value): value is TypeVal {
  return value.kind === "type";
}
function getValueTypeTitle(value: Value): string {
  if (isNone(value)) {
    return "";
  }
  if (isObjectVal(value)) {
    return value.type_name;
  }
  if (isCollection(value)) {
    return `${value.kind}[${value.element_count}]`;
  }
  if (isDictType(value)) {
    return `${value.kind}[${value.pair_count}]`;
  }
  return value.kind;
}
</script>

<template>
  <div class="value">
    <div class="type-name">{{ getValueTypeTitle(value) }}</div>
    <None v-if="isNone(value)" :value="value as NoneVal" />
    <Scalar v-else-if="isScalar(value)" :value="value as ScalarVal" />
    <Complex v-else-if="isComplex(value)" :value="value as ComplexVal" />
    <Str v-else-if="isStr(value)" :value="value as DeferredStrVal" />
    <Collection
      v-else-if="isCollection(value)"
      :value="value as CollectionVal"
    />
    <Dict v-else-if="isDictType(value)" :value="value as DeferredDictVal" />
    <Range v-else-if="isRangeVal(value)" :value="value as RangeVal" />
    <FunctionComponent
      v-else-if="isFunctionVal(value)"
      :value="value as FunctionVal"
    />
    <ObjectComponent
      v-else-if="isObjectVal(value)"
      :value="value as DeferredObjectVal"
    />
    <ModuleComponent
      v-else-if="isModuleVal(value)"
      :value="value as ModuleVal"
    />
    <TypeComponent v-else-if="isTypeVal(value)" :value="value as TypeVal" />
  </div>
</template>

<style scoped lang="scss">
.value {
  display: flex;
  flex-direction: column;
}

.type-name {
  font-size: 0.9em;
  color: #3f3f3f;
}
</style>
