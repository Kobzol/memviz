<script setup lang="ts">
import { computed } from "vue";
import { bufferToByteArray } from "../../../utils";

const props = defineProps<{
    buffer: ArrayBuffer;
}>();

const array = computed(() => bufferToByteArray(props.buffer));
</script>

<template>
    <div class="byte-array">
        <div class="byte" v-for="value in array"><code>{{ value }}</code></div>
    </div>
</template>

<style scoped lang="scss">
.byte-array {
    display: flex;
    flex-direction: row;
}

.byte {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 35px;
    border: 1px solid #000000;
}
</style>
