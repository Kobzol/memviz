import type { ProcessState } from "process-def";
import { type Ref, type ShallowRef, ref, shallowRef } from "vue";
import { AllocationTracker } from "../allocation-tracker";
import { ProcessBuilder } from "../resolver/eager";
import type { ProcessResolver } from "../resolver/resolver";
import { ComponentMap } from "./pointers/component-map";
import { PointerMap } from "./pointers/pointer-map";

interface AppState {
  processState: Readonly<ProcessState>;
  resolver: Readonly<ProcessResolver>;
}

function createDefaultState(): AppState {
  const processBuilder = new ProcessBuilder();
  const [processState, resolver] = processBuilder.build();
  return {
    processState,
    resolver,
  };
}

export const appState: Ref<AppState> = ref(createDefaultState());

export const allocationState: ShallowRef<AllocationTracker> = shallowRef(
  new AllocationTracker(),
);

export interface UIConfiguration {
  visualizePointers: boolean;
}

export const uiConfiguration: Ref<UIConfiguration> = ref({
  visualizePointers: true,
});

export const componentMap: ShallowRef<ComponentMap> = shallowRef(
  new ComponentMap(),
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
