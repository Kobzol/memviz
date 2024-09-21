<script setup lang="ts">
import { type Ref, computed, ref, watch } from "vue";
import { addressToStr } from "../../../utils";
import { appState } from "../../store";
import { type Value, scalarAsString } from "../../value";
import ByteArray from "./bytearray.vue";

const props = defineProps<{
    value: Value;
}>();

enum DisplayMode {
    String = "string",
    ByteArray = "per-byte",
}

async function loadData() {
    const address = props.value.address;
    if (address === null) {
        return;
    }
    buffer.value = await resolver.value.readMemory(
        addressToStr(address),
        props.value.type.size,
    );
}

function toggleDisplayMode() {
    if (displayMode.value === DisplayMode.String) {
        displayMode.value = DisplayMode.ByteArray;
    } else if (displayMode.value === DisplayMode.ByteArray) {
        displayMode.value = DisplayMode.String;
    }
}

const resolver = computed(() => appState.value.resolver);
const displayMode = ref(DisplayMode.String);

const buffer: Ref<ArrayBuffer | null> = ref(null);
const bufferAsString = computed(() => {
    if (buffer.value === null) return "";
    return scalarAsString(buffer.value, props.value.type);
});

watch(
    () => props.value,
    () => {
        loadData();
    },
    { immediate: true },
);
</script>

<template>
    <div class="scalar" @click="toggleDisplayMode" :title="bufferAsString">
        <template v-if="buffer !== null">
            <span class="string" v-if="displayMode === DisplayMode.String">
                {{ bufferAsString }}
            </span>
            <ByteArray v-else :buffer="buffer"></ByteArray>
        </template>
    </div>
</template>

<style scoped lang="scss">
.scalar {
    display: flex;
    justify-content: end;
    padding: 0px 5px;
}

.string {
    padding: 1px 0;
}
</style>
