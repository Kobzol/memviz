<script setup lang="ts">
import { type Ref, computed, ref, shallowRef, watch } from "vue";
import { addressToStr } from "../../../utils";
import { appState } from "../../store";
import { Path } from "../../pointers/path";
import { Value } from "../../utils/value";
import { TyEnum } from "process-def";
import TooltipContributor from "../tooltip/tooltip-contributor.vue";
import { bufferAsBigUnsignedInt } from "../../utils/formatting";

const props = defineProps<{
  value: Value<TyEnum>;
  path: Path;
}>();

enum DisplayMode {
  EnumValue = "enum-value",
  Number = "number",
}

async function loadData() {
  const address = props.value.address;
  if (address === null) {
    return;
  }

  buffer.value = await resolver.value.readMemory(
    addressToStr(address),
    props.value.type.size
  );
}

function toggleDisplayMode() {
  if (displayMode.value === DisplayMode.EnumValue) {
    displayMode.value = DisplayMode.Number;
  } else if (displayMode.value === DisplayMode.Number) {
    displayMode.value = DisplayMode.EnumValue;
  }
}

const resolver = computed(() => appState.value.resolver);
const displayMode = ref(DisplayMode.EnumValue);

const buffer: Ref<ArrayBuffer | null> = shallowRef(null);
const bufferAsNumber = computed((): bigint | null => {
  if (buffer.value === null) return null;
  return bufferAsBigUnsignedInt(buffer.value, props.value.type.size);
});
const bufferAsEnumVariantName = computed((): string | null => {
  if (bufferAsNumber.value === null) return null;

  const variants = props.value.type.fields;
  return (
    variants.find((v) => BigInt(v.value) === bufferAsNumber.value)?.name ?? null
  );
});

const tooltip = computed(() => {
  return `Enum <b>${props.value.type.name}</b> with value <b>${
    bufferAsEnumVariantName.value ?? "&lt;unknown&gt;</b>"
  } (<b>${bufferAsNumber.value}</b>)`;
});

watch(
  () => [props.value, resolver.value],
  () => loadData(),
  { immediate: true }
);
</script>

<template>
  <TooltipContributor :tooltip="tooltip">
    <div class="enum" @click="toggleDisplayMode">
      <template v-if="buffer !== null">
        <div
          v-if="
            displayMode === DisplayMode.EnumValue &&
            bufferAsEnumVariantName !== null
          "
        >
          <code>{{ bufferAsEnumVariantName }}</code>
        </div>
        <div v-else>
          <code>{{ bufferAsNumber }}</code>
        </div>
      </template>
    </div>
  </TooltipContributor>
</template>

<style lang="scss" scoped>
.enum {
  padding: 0px 5px;
  &:hover {
    cursor: pointer;
  }
}
</style>
