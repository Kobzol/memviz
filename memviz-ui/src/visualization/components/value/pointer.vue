<script setup lang="ts">
import { type Ref, computed, ref, watch, watchEffect } from "vue";
import { addressToStr, assert, bufferToByteArray } from "../../../utils";
import { appState, pointerTargets } from "../../store";
import { type Value, bufferAsBigInt, formatAddress, scalarAsString } from "../../formatting";
import { Path } from "../../path";
import { Address, TyPtr } from "process-def";
import ByteArray from "./bytearray.vue";
import { typeUint32 } from "../../../resolver/eager";
import { TyInt } from "process-def/src";

const props = defineProps<{
    value: Value<TyPtr>;
    path: Path;
}>();

async function loadData() {
    const address = props.value.address;
    if (address === null) {
        return;
    }
    buffer.value = await resolver.value.readMemory(
        addressToStr(address),
        props.value.type.size,
    );
    console.log(`Looking for element with address ${targetAddress.value}`);
    pointerTargets.targets.push(BigInt(1));
}

function formatAsString(): string {
    assert(buffer.value !== null, "buffer is null");
    return formatAddress(targetAddress.value);
}

const targetAddress = computed((): Address | null => {
    if (buffer.value === null) return null;
    return bufferAsBigInt(buffer.value, props.value.type.size)
});

const resolver = computed(() => appState.value.resolver);

const buffer: Ref<ArrayBuffer | null> = ref(null);

watchEffect(() => loadData());
</script>

<template>
    <div class="ptr">
        <template v-if="buffer !== null">
            <span class="string">
                {{ formatAsString() }}
            </span>
        </template>
    </div>
</template>

<style scoped lang="scss">
.string {
    padding: 1px 0;
}
</style>
