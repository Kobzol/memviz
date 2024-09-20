import type { ProcessState } from "process-def";
import { type Ref, ref } from "vue";
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
