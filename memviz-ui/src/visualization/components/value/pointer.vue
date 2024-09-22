<script setup lang="ts">
import {
  type Ref,
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  watchEffect,
} from "vue";
import { addressToStr, assert } from "../../../utils";
import { appState, componentMap, notifyComponentMap } from "../../store";
import { type Value, bufferAsBigInt, formatAddress } from "../../formatting";
import { Path } from "../../pointers/path";
import { Address, TyPtr } from "process-def";
import { LeaderLine } from "leader-line";

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
  await nextTick();
  // notifyComponentMap();
  tryAddArrow();
}

function formatAsString(): string {
  assert(buffer.value !== null, "buffer is null");
  return formatAddress(targetAddress.value);
}

function tryAddArrow() {
  // TODO: re-enable pointers
  return;
  // if (elementRef.value === null || targetAddress.value === null) {
  //   tryRemoveArrow();
  //   return;
  // }

  // const targets = componentMap.value.getComponentsAt(targetAddress.value);
  // if (targets.length === 0) {
  //   tryRemoveArrow();
  //   return;
  // }

  // // TODO: select by deepest path
  // const target = targets[0];
  // if (arrow.value !== null) {
  //   tryRemoveArrow();
  // }

  // // Hack: allow LeaderLine to calculate positions correctly
  // const transform = document.body.style.removeProperty("transform");
  // arrow.value = new LeaderLine(elementRef.value, target.element, {
  //   path: "straight",
  //   startSocket: "right",
  //   endSocket: "left",
  // });
  // document.body.style.setProperty("transform", transform);
}

function tryRemoveArrow() {
  if (arrow.value !== null) {
    arrow.value.remove();
    arrow.value = null;
  }
}

const targetAddress = computed((): Address | null => {
  const type = props.value.type;
  if (buffer.value === null) return null;
  return bufferAsBigInt(buffer.value, type.size);
});

const resolver = computed(() => appState.value.resolver);

const buffer: Ref<ArrayBuffer | null> = shallowRef(null);
const elementRef: Ref<HTMLDivElement | null> = shallowRef(null);
const arrow: Ref<LeaderLine | null> = shallowRef(null);

watch(
  () => [props.value, resolver.value],
  () => loadData(),
  { immediate: true }
);

watch(componentMap, () => {
  tryAddArrow();
});
onMounted(() => tryAddArrow());

onBeforeUnmount(() => tryRemoveArrow());
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
