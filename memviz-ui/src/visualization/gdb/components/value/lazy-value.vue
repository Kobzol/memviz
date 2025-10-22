<script setup lang="ts">
import { Type } from "process-def";
import { Path } from "../../pointers/path";
import { Value } from "../../utils/value";
import { ref } from "vue";

import ValueComponent from "./value.vue";

const props = defineProps<{
  value: Value<Type>;
  path: Path;
}>();

function isComplexType(type: Type): boolean {
  return type.kind === "struct" || type.kind === "array";
}

function expand() {
  expanded.value = true;
}

const expanded = ref(!isComplexType(props.value.type));
</script>

<template>
  <div>
    <ValueComponent v-if="expanded" :value="value" :path="path" />
    <div class="expand-btn" v-else @click="expand">...</div>
  </div>
</template>

<style lang="scss" scoped>
.expand-btn {
  cursor: pointer;
  font-size: 2em;
}
</style>
