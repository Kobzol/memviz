import { atom } from "jotai";
import type { ProcessState } from "../process/memory";
import { EagerResolver } from "../process/resolver/eager";
import type { ProcessResolver } from "../process/resolver/resolver";

export interface UIState {
  processState: Readonly<ProcessState>;
  resolver: Readonly<ProcessResolver>;
}

export const rootStateAtom = atom<Readonly<UIState>>(createDefaultState());
export const resolverAtom = atom((get) => get(rootStateAtom)?.resolver);

function createDefaultState(): UIState {
  const processState: ProcessState = {
    threads: [],
  };
  const resolver = new EagerResolver({});
  return {
    processState,
    resolver,
  };
}
