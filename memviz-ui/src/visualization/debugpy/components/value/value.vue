<script setup lang="ts">
import None from "./none.vue";
import Scalar from "./scalar.vue";
import Complex from "./complex.vue";
import Str from "./str.vue";
import FlatCollection from "./collection/flat-collection.vue";
import Dict from "./collection/dict.vue";
import Range from "./range.vue";
import FunctionComponent from "./function.vue";
import ObjectComponent from "./object/object.vue";
import ModuleComponent from "./module.vue";
import TypeComponent from "./type.vue";
import {
  isScalar,
  isFlatCollection,
  isNone,
  isComplex,
  isStr,
  isDict,
  isRange,
  isFunction,
  isObject,
  isModule,
  isType,
} from "../../utils/types";
import { RichValue } from "../../type/type";
import { PythonId } from "process-def/debugpy";
import { computed } from "vue";
import { valueState } from "../../store";

const props = defineProps<{
  id: PythonId;
}>();

const pythonValue = computed(() => {
  let val = valueState.value.getValueOrThrow(props.id);
  return val as RichValue;
});

function getValueTypeTitle(value: RichValue): string {
  if (isNone(value)) {
    return "";
  }
  if (isStr(value)) {
    return `${value.kind}[${value.length}]`;
  }
  if (isObject(value)) {
    return value.type_name;
  }
  if (isFlatCollection(value)) {
    return `${value.kind}[${value.element_count}]`;
  }
  if (isDict(value)) {
    return `${value.kind}[${value.pair_count}]`;
  }
  return value.kind;
}
</script>

<template>
  <div class="value">
    <div class="type-name">
      {{ getValueTypeTitle(pythonValue) }}
    </div>
    <div>
      <None v-if="isNone(pythonValue)" :id="props.id" />
      <Scalar v-else-if="isScalar(pythonValue)" :id="props.id" />
      <Complex v-else-if="isComplex(pythonValue)" :id="props.id" />
      <Str v-else-if="isStr(pythonValue)" :id="props.id" />
      <FlatCollection
        v-else-if="isFlatCollection(pythonValue)"
        :id="props.id"
      />
      <Dict v-else-if="isDict(pythonValue)" :id="props.id" />
      <Range v-else-if="isRange(pythonValue)" :id="props.id" />
      <FunctionComponent v-else-if="isFunction(pythonValue)" :id="props.id" />
      <ObjectComponent v-else-if="isObject(pythonValue)" :id="props.id" />
      <ModuleComponent v-else-if="isModule(pythonValue)" :id="props.id" />
      <TypeComponent v-else-if="isType(pythonValue)" :id="props.id" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.type-name {
  font-size: 0.9em;
  color: #3f3f3f;
  margin-bottom: 5px;
}
.value {
  padding: 5px;
}
</style>
