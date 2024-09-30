<script setup lang="ts">
import {
  type Ref,
  computed,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  shallowRef,
  watch,
} from "vue";
import { addressToStr, assert } from "../../../utils";
import { appState, componentMap } from "../../store";
import { bufferAsBigInt, formatAddress } from "../../utils/formatting";
import { Path } from "../../pointers/path";
import { Address, TyPtr } from "process-def";
import { LeaderLine } from "leader-line";
import { withDisabledPanZoom } from "../../utils/panzoom";
import { ComponentWithAddress } from "../../pointers/component-map";
import { Value, valueToRegion } from "../../utils/value";
import PtrTarget from "../ptrtarget.vue";

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

function tryAddArrow() {
  if (
    elementRef.value === null ||
    targetAddress.value === null ||
    targetAddress.value === BigInt(0)
  ) {
    tryRemoveArrow();
    return;
  }
  const target = selectTarget(
    componentMap.value.getComponentsAt(targetAddress.value)
  );
  if (target === null) {
    tryRemoveArrow();
    return;
  }
  // console.log(
  //   targetAddress.value,
  //   target.address,
  //   target.element,
  //   target.element.getBoundingClientRect(),
  //   target.path.format()
  // );
  if (arrow.value !== null) {
    tryRemoveArrow();
  }

  //TODO: Mutation observer?
  // Hack: allow LeaderLine to calculate positions correctly
  withDisabledPanZoom(() => {
    arrow.value = new LeaderLine(elementRef.value!, target.element, {
      path: "straight",
      startSocket: "right",
      endSocket: "left",
    });
  });
}

function selectTarget(
  components: ComponentWithAddress[]
): ComponentWithAddress | null {
  let target: ComponentWithAddress | null = null;
  for (const component of components) {
    if (target === null || target.path.length() < component.path.length()) {
      target = component;
    }
  }
  return target;
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

onMounted(() => {
  tryAddArrow();
});
onUpdated(() => {
  tryAddArrow();
});
onBeforeUnmount(() => tryRemoveArrow());
// TODO: tooltip (pointing to ...)
</script>

<template>
  <div class="ptr" :ref="(el: any) => elementRef = el">
    <template v-if="buffer !== null">
      <PtrTarget :region="valueToRegion(value)" :path="path">
        <span class="string">
          {{ formatAsString() }}
        </span>
      </PtrTarget>
    </template>
  </div>
</template>

<style scoped lang="scss">
.string {
  padding: 1px 0;
}
</style>
