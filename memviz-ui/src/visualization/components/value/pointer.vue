<script setup lang="ts">
import {
  type Ref,
  computed,
  onBeforeUnmount,
  ref,
  watch,
  watchEffect,
} from "vue";
import { addressToStr, assert } from "../../../utils";
import { appState, componentMap } from "../../store";
import { type Value, bufferAsBigInt, formatAddress } from "../../formatting";
import { Path } from "../../pointers/path";
import { Address, TyPtr } from "process-def";

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
    props.value.type.size
  );
}

function formatAsString(): string {
  assert(buffer.value !== null, "buffer is null");
  return formatAddress(targetAddress.value);
}

function addPointerSource() {
  if (elementRef.value === null || targetAddress.value === null) return;

  // console.log(`Looking for element with address ${targetAddress.value}`);
  // componentMap.activePointers.push({
  //   source: elementRef.value,
  //   target: targetAddress.value,
  // });
}

function removePointerSource() {
  // TODO: create a unique identifier
  // for (const item of componentMap.activePointers) {
  // }
}

function matchesTarget(address: Address): boolean {
  if (props.value.address === null) return false;

  const start = props.value.address;
  return start <= address && address < start + BigInt(props.value.type.size);
}

// function disposeArrow() {
//   if (arrow.value !== null) {
//     arrow.value.remove();
//     arrow.value = null;
//   }
// }

// function checkTarget() {
//   const targetRef = elementRef.value;
//   if (targetRef === null) return;

//   console.log("FINDING MATCHES");
//   let srcPointer = null;
//   for (const ptr of pointers) {
//     if (matchesTarget(ptr.target)) {
//       console.log("FOUND TARGET MATCH");
//       srcPointer = ptr.source;
//       break;
//     }
//   }
//   if (srcPointer === null) return;
//   source.value = srcPointer;

//   if (arrow.value === null) {
//     arrow.value = new LeaderLine(source.value, targetRef, {
//       path: "straight",
//     });
//   } else {
//     arrow.value.setOptions({
//       start: source.value,
//       end: targetRef,
//     });
//   }
// }

const targetAddress = computed((): Address | null => {
  if (buffer.value === null) return null;
  return bufferAsBigInt(buffer.value, props.value.type.size);
});

const resolver = computed(() => appState.value.resolver);

const buffer: Ref<ArrayBuffer | null> = ref(null);
const elementRef: Ref<HTMLDivElement | null> = ref(null);

watchEffect(() => loadData());

watch(
  () => [elementRef.value, targetAddress.value],
  () => addPointerSource()
);
onBeforeUnmount(() => removePointerSource());
</script>

<template>
  <div class="ptr" :ref="(el: any) => elementRef = el">
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
