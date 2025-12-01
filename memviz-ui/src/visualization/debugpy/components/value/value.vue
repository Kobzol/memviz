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
  isNone,
  type ScalarVal,
  isScalar,
  isCollection,
  isDict,
  isComplex,
  isStr,
  isRange,
  isFunction,
  isObject,
  isModule,
  isType,
} from "../../utils/types";
import { PropType } from "vue";
import {
  valueDisplaySettings,
  DisplayMode,
} from "../../value-display-settings";

const props = defineProps({
  value: {
    type: Object as PropType<Value>,
    required: true,
  },
  displayMode: {
    type: String as PropType<DisplayMode>,
    required: true,
    default: DisplayMode.INLINE,
  },
});
</script>

<template>
  <div v-if="valueDisplaySettings.get(value.kind) === displayMode">
    <None v-if="isNone(value)" :value="value as NoneVal" />
    <Scalar v-else-if="isScalar(value)" :value="value as ScalarVal" />
    <Complex v-else-if="isComplex(value)" :value="value as ComplexVal" />
    <Str v-else-if="isStr(value)" :value="value as DeferredStrVal" />
    <Collection
      v-else-if="isCollection(value)"
      :value="value as CollectionVal"
    />
    <Dict v-else-if="isDict(value)" :value="value as DeferredDictVal" />
    <Range v-else-if="isRange(value)" :value="value as RangeVal" />
    <FunctionComponent
      v-else-if="isFunction(value)"
      :value="value as FunctionVal"
    />
    <ObjectComponent
      v-else-if="isObject(value)"
      :value="value as DeferredObjectVal"
    />
    <ModuleComponent v-else-if="isModule(value)" :value="value as ModuleVal" />
    <TypeComponent v-else-if="isType(value)" :value="value as TypeVal" />
  </div>
</template>
