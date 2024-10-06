<script setup lang="ts">
import {
  ShallowRef,
  computed,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  shallowRef,
  watch,
} from "vue";
import { addressToStr, assert } from "../../../utils";
import {
  appState,
  componentMap,
  pointerMap,
  uiConfiguration,
} from "../../store";
import { bufferAsBigInt, formatAddress } from "../../utils/formatting";
import { Path } from "../../pointers/path";
import { Address, TyPtr } from "process-def";
import { LeaderLine } from "leader-line";
import { withDisabledPanZoom } from "../../utils/panzoom";
import { ComponentWithAddress } from "../../pointers/component-map";
import { Value, valueToRegion } from "../../utils/value";
import PtrTarget from "../ptr-target.vue";
import { PointerUnsubscribeFn } from "../../pointers/pointer-map";

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
    !enabled ||
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

  //TODO: Mutation observer to dynamically react to target location changes?
  // Hack: allow LeaderLine to calculate positions correctly with panzoom
  withDisabledPanZoom(() => {
    const source = elementRef.value!;

    // A simple heuristic for deciding if the target should be pointed at from the top or the bottom
    const targetIsDown =
      source.getBoundingClientRect().y <
      target.element.getBoundingClientRect().y;
    const targetY = targetIsDown ? 0 : "100%";
    const targetEndSocket = targetIsDown ? "top" : "bottom";

    arrow.value = new LeaderLine(
      LeaderLine.pointAnchor(source, {
        x: source.clientWidth + 10,
        y: "50%",
      }),
      LeaderLine.pointAnchor(target.element, { x: "50%", y: targetY }),
      {
        path: "grid",
        startSocket: "right",
        endSocket: targetEndSocket,
        startPlug: "disc",
        startPlugSize: 1.25,
        // startPlugColor: "black",
        startPlugOutline: true,
        startPlugOutlineSize: 2,
        startPlugOutlineColor: "black",
        endPlug: "arrow2",
        endPlugSize: 1.25,
        // endPlugColor: "black",
        color: "coral",
        size: 4,
        // dash: { len: 4, gap: 4, animation: true },
        dropShadow: { dx: 1, dy: 1, blur: 2 },
      }
    );
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

function tryUnsubscribe() {
  if (unsubscribeFn.value !== null) {
    unsubscribeFn.value();
    unsubscribeFn.value = null;
  }
}

const targetAddress = computed((): Address | null => {
  const type = props.value.type;
  if (buffer.value === null) return null;
  return bufferAsBigInt(buffer.value, type.size);
});

const resolver = computed(() => appState.value.resolver);
const enabled = computed(() => {
  return uiConfiguration.value.visualizePointers;
});

const buffer: ShallowRef<ArrayBuffer | null> = shallowRef(null);
const elementRef: ShallowRef<HTMLDivElement | null> = shallowRef(null);
const arrow: ShallowRef<LeaderLine | null> = shallowRef(null);
const unsubscribeFn: ShallowRef<PointerUnsubscribeFn | null> = shallowRef(null);

watch(
  () => [props.value, resolver.value],
  () => loadData(),
  { immediate: true }
);

watch(componentMap, () => {
  tryAddArrow();
});
watch(enabled, () => {
  if (enabled.value) {
    tryAddArrow();
  } else {
    tryRemoveArrow();
  }
});
watch(targetAddress, () => {
  tryUnsubscribe();

  if (targetAddress.value !== null) {
    unsubscribeFn.value = pointerMap.value.addPointer(
      targetAddress.value,
      props.value.type.target,
      pointerMap
    );
  }
});

onMounted(() => {
  tryAddArrow();
});
onUpdated(() => {
  tryAddArrow();
});
onBeforeUnmount(() => {
  tryRemoveArrow();
  tryUnsubscribe();
});
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
