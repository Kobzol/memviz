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

export const tooltipStack: Ref<string[]> = ref([]);
export function addToTooltip(tooltip: string) {
  tooltipStack.value.push(tooltip);
}
export function removeFromTooltip() {
  tooltipStack.value.pop();
}
