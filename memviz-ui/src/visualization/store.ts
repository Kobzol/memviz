import type { Address, ProcessState } from "process-def";
import { type Reactive, type Ref, reactive, ref } from "vue";
import { ProcessBuilder } from "../resolver/eager";
import type { ProcessResolver } from "../resolver/resolver";

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

interface PointerState {
  targets: Address[];
}

export const pointerTargets: Reactive<PointerState> = reactive({ targets: [] });
