<script setup lang="ts">
import { type Ref, computed, ref, watchEffect } from "vue";
import { addressToStr, assert } from "../../../utils";
import { appState } from "../../store";
import { type Value } from "../../formatting";
import { TyArray, Type } from "process-def";
import ValueComponent from "./value.vue";
import { Path } from "../../path";

const props = defineProps<{
    value: Value<TyArray>;
    path: Path;
}>();

const MAX_ELEMENTS_TO_LOAD = 5;

async function loadData() {
    const address = props.value.address;
    if (address === null) {
        return;
    }

    const innerType = props.value.type.type;
    const count = Math.min(props.value.type.element_count, MAX_ELEMENTS_TO_LOAD);

    // Preload the memory of the individual array elements
    await resolver.value.readMemory(
        addressToStr(address),
        innerType.size * count,
    );
    elementsToShow.value = count;
}

function createValue(index: number): Value<Type> {
    const { type, address } = props.value;
    assert(index >= 0, "array index negative");
    assert(index < type.element_count, "array index out of bounds");

    // Address should not be null, otherwise elementsToShow would be zero
    return {
        address: address! + BigInt(index * type.type.size),
        type: type.type
    };
}

function createPath(index: number): Path {
    return props.path.makeArrayIndex(index);
}

const resolver = computed(() => appState.value.resolver);

const elementsToShow: Ref<number> = ref(0);

watchEffect(() => loadData());
</script>

<template>
    <div class="array">
        <div class="element" v-for="(_, index) in elementsToShow">
            <ValueComponent :value="createValue(index)" :path="createPath(index)" />
        </div>
    </div>
</template>

<style scoped lang="scss">
.array {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: start;
    padding: 0px 5px;
}

.element {
    min-width: 40px;
    border: 1px solid #000000;
    display: flex;
    justify-content: center;
}
</style>
