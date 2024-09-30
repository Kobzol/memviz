import type { ProcessState } from "process-def";
import { type Ref, type ShallowRef, ref, shallowRef, triggerRef } from "vue";
import { ProcessBuilder } from "../resolver/eager";
import type { ProcessResolver } from "../resolver/resolver";
import { ComponentMap } from "./pointers/component-map";

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

export const componentMap: ShallowRef<ComponentMap> = shallowRef(
  new ComponentMap(),
);
export function notifyComponentMap() {
  triggerRef(componentMap);
}

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
