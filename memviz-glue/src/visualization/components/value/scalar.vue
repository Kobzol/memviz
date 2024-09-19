<script setup lang="ts">
import { computed, ref } from "vue";
import { appState } from "../../store";
import { scalarAsString, type Value } from "../../value";
import { addressToStr, bufferToByteArray } from "../../../utils";

const props = defineProps<{
    value: Value;
}>();

async function loadData() {
    const address = props.value.address;
    if (address === null) {
        scalarValue.value = "<no-addr>";
        return;
    }
    const buffer = await resolver.value.readMemory(addressToStr(address), props.value.type.size);
    const scalar = scalarAsString(buffer, props.value.type);
    scalarValue.value = scalar;
}

const resolver = computed(() => appState.value.resolver);
const scalarValue = ref("<val>");
loadData();
</script>

<template>
    <div>
        {{ scalarValue }}
    </div>
</template>

<style scoped lang="scss"></style>
