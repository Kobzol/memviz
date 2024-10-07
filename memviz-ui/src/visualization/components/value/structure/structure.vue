<script setup lang="ts">
import { computed, watch } from "vue";
import { addressToStr } from "../../../../utils";
import { appState } from "../../../store";
import { Type, TyStruct } from "process-def";
import { Path } from "../../../pointers/path";
import { Value } from "../../../utils/value";
import { pluralize } from "../../../utils/formatting";

import LazyValue from "../lazy-value.vue";
import TooltipContributor from "../../tooltip/tooltip-contributor.vue";

const props = defineProps<{
  value: Value<TyStruct>;
  path: Path;
}>();

interface Field {
  name: string;
  type: Type;
  offsetBytes: number;
}

async function loadData() {
  const address = props.value.address;
  if (address === null) {
    return;
  }

  // Preload the memory of the individual struct elements
  await resolver.value.readMemory(addressToStr(address), props.value.type.size);
}

function createValue(field: Field): Value<Type> {
  return {
    address: props.value.address! + BigInt(field.offsetBytes),
    type: field.type,
  };
}

function createPath(field: Field): Path {
  return props.path.makeStructField(field.name);
}

function getTooltip(field: Field): string {
  return `Field <b>${field.name}</b> of struct <b>${props.value.type.name}</b> of type <b>${field.type.name}</b> (at offset ${field.offsetBytes})`;
}

const fields = computed((): Field[] => {
  return props.value.type.fields.map((field) => ({
    name: field.name,
    type: field.type,
    offsetBytes: field.offset_bits / 8,
  }));
});

const tooltip = computed(() => {
  const fieldCount = props.value.type.fields.length;
  return `Structure <b>${
    props.value.type.name
  }</b> with <b>${fieldCount}</b> ${pluralize("field", fieldCount)}`;
});

const resolver = computed(() => appState.value.resolver);

watch(
  () => [props.value, resolver.value],
  () => loadData(),
  { immediate: true }
);
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <div class="struct">
      <template v-for="field in fields" :key="field.name">
        <TooltipContributor class="field" :tooltip="getTooltip(field)">
          <code class="decl">{{ field.type.name }} {{ field.name }}</code>
          <LazyValue :value="createValue(field)" :path="createPath(field)" />
        </TooltipContributor>
      </template>
    </div>
  </TooltipContributor>
</template>

<style scoped lang="scss">
.struct {
  display: flex;
  flex-direction: column;
  align-items: start;
}

.field {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.decl {
  display: flex;
  flex-direction: row;
  border: 3px solid #000000;
  padding: 3px;
  margin-right: 5px;
  background-color: #a4c5ea;
  border-radius: 5px;
}
</style>
