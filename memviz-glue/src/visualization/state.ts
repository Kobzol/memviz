import { produce } from "immer";
import { atom } from "jotai";
import type { ProcessState } from "../../process/memory";
import { EagerResolver } from "../../process/resolver/eager";
import type { ProcessResolver } from "../../process/resolver/resolver";

export interface UIState {
  processState: Readonly<ProcessState>;
  resolver: Readonly<ProcessResolver>;
  expanded: boolean;
}

export const rootStateAtom = atom<Readonly<UIState>>(createDefaultState());
export const resolverAtom = atom((get) => get(rootStateAtom)?.resolver);

export const expandedStackFrame = atom(
  (get) => get(rootStateAtom).expanded,
  (get, set, expanded: boolean) =>
    set(
      rootStateAtom,
      produce(get(rootStateAtom), (val) => {
        val.expanded = expanded;
      }),
    ),
);

function createDefaultState(): UIState {
  const processState: ProcessState = {
    threads: [],
  };
  const resolver = new EagerResolver({});
  return {
    processState,
    resolver,
    expanded: false,
  };
}
