<script setup lang="ts">
import { computed } from "vue";
import type { Value } from "../../value";

import Scalar from "./scalar.vue";

const props = defineProps<{
    value: Value;
}>();

const isScalar = computed(() => {
    const type = props.value.type;
    return type.kind === "bool" || type.kind === "int" || type.kind === "float";
});
</script>

<template>
    <div class="value">
        <Scalar v-if="isScalar" :value="value"></Scalar>
        <div v-else>&lg;value&gt;</div>
    </div>
</template>

<style scoped lang="scss">
.value {
    flex-grow: 1;

    &:hover {
        cursor: pointer;
        background-color: #DDDDDD;
    }
}
</style>
