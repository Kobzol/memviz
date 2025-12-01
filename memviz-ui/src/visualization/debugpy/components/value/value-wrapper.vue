<script setup lang="ts">
import type { Value } from "process-def/debugpy";
import { isNone, isCollection, isDict, isObject } from "../../utils/types";
import { PropType } from "vue";
import {
  valueDisplaySettings,
  DisplayMode,
} from "../../value-display-settings";
import ValueComponent from "./value.vue";

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

function getValueTypeTitle(value: Value): string {
  if (isNone(value)) {
    return "";
  }
  if (isObject(value)) {
    return value.type_name;
  }
  if (isCollection(value)) {
    return `${value.kind}[${value.element_count}]`;
  }
  if (isDict(value)) {
    return `${value.kind}[${value.pair_count}]`;
  }
  return value.kind;
}
</script>

<template>
  <div
    class="value"
    :class="{
      heapValue:
        displayMode == DisplayMode.DETACHED &&
        valueDisplaySettings.get(value.kind) === displayMode,
    }"
  >
    <div
      class="type-name"
      v-if="valueDisplaySettings.get(value.kind) === displayMode"
    >
      {{ getValueTypeTitle(value) }}
    </div>
    <ValueComponent :value="value" :displayMode="displayMode"></ValueComponent>
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
  min-height: 0.9em;
}

.heapValue {
  flex: 3;
  min-width: 0;
  word-break: break-all;
  background: #ffffff;
  border-top: solid 1px #000000;
  padding: 5px;
  gap: 6px;
}
</style>
