import { type ProcessState, SessionType } from "process-def";
import { type Ref, type ShallowRef, ref, shallowRef } from "vue";
import { ProcessBuilder } from "../resolver/eager";
import { ProcessResolver } from "../resolver/resolver";
import { ComponentMap as DebugpyComponentMap } from "./debugpy/component-map";
import { ValueTracker } from "./debugpy/value-tracker";
import { AllocationTracker } from "./gdb/allocation-tracker";
import { ComponentMap as GDBComponentMap } from "./gdb/pointers/component-map";
import { PointerMap } from "./gdb/pointers/pointer-map";

interface AppState {
  processState: Readonly<ProcessState>;
  sessionType: SessionType;
}

const processBuilder = new ProcessBuilder();
const [initialProcessState, innerResolver] = processBuilder.build();

export const appState: Ref<AppState> = ref({
  processState: initialProcessState,
  sessionType: SessionType.GDB,
});

export const processResolver: ShallowRef<ProcessResolver> = shallowRef(
  new ProcessResolver(innerResolver),
);

export const allocationState: ShallowRef<AllocationTracker> = shallowRef(
  new AllocationTracker(),
);

export const valueState: ShallowRef<ValueTracker> = shallowRef(
  new ValueTracker(),
);

export interface UIConfiguration {
  visualizePointers: boolean;
}

export const uiConfiguration: Ref<UIConfiguration> = ref({
  visualizePointers: true,
});

export const gdbComponentMap: ShallowRef<GDBComponentMap> = shallowRef(
  new GDBComponentMap(),
);

export const debugpyComponentMap: ShallowRef<DebugpyComponentMap> = shallowRef(
  new DebugpyComponentMap(),
);

export const pointerMap: ShallowRef<PointerMap> = shallowRef(new PointerMap());

export interface TooltipEntry {
  text: string;
  element: Element;
}

export const tooltipStack: Ref<TooltipEntry[]> = ref([]);
export function pushTooltip(entry: TooltipEntry) {
  tooltipStack.value = [...tooltipStack.value, entry];
}
export function popTooltip() {
  if (tooltipStack.value.length > 0) {
    tooltipStack.value = tooltipStack.value.slice(0, -1);
  }
}
export function clearTooltip() {
  tooltipStack.value = [];
}
