import { atom } from "jotai";
import type { ProcessState } from "process-def";
import { ProcessBuilder } from "../resolver/eager";
import type { ProcessResolver } from "../resolver/resolver";

export interface UIState {
  processState: Readonly<ProcessState>;
  resolver: Readonly<ProcessResolver>;
}

export const rootStateAtom = atom<Readonly<UIState>>(createDefaultState());
export const resolverAtom = atom((get) => get(rootStateAtom)?.resolver);

function createDefaultState(): UIState {
  const processBuilder = new ProcessBuilder();
  const [processState, resolver] = processBuilder.build();
  return {
    processState,
    resolver,
  };
}
