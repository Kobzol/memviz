import createPanZoom from "panzoom";
import type { ProcessState, StackTrace } from "process-def";
import type { ProcessResolver } from "../resolver/resolver";
import { createRoot } from "react-dom/client";
import * as React from "react";
import { createStore, Provider, useAtomValue } from "jotai";
import { StackTraceComponent } from "./components/stackTrace";
import { rootStateAtom } from "./state";
import { useAsyncFn } from "./utils";

export class Memviz {
  private store = createStore();

  constructor(root: HTMLElement) {
    createPanZoom(root, {
      smoothScroll: false,
      onDoubleClick: (_e) => {
        return false; // tells the library to not preventDefault, and not stop propagation
      },
      beforeMouseDown: (e) => {
        // Only allow panning with the middle mouse button
        const shouldIgnore = e.button !== 1;
        return shouldIgnore;
      },
      zoomDoubleClickSpeed: 1,
    });
    createRoot(root).render(
      <Provider store={this.store}>
        <div style={{ width: "100%", height: "100%" }}>
          <App />
        </div>
      </Provider>,
    );
  }

  async showState(state: ProcessState, resolver: ProcessResolver) {
    this.store.set(rootStateAtom, {
      processState: state,
      resolver,
    });
  }
}

function App() {
  const state = useAtomValue(rootStateAtom);
  const [stackTrace, isLoading] = useAsyncFn<StackTrace>(async () => {
    if (state.processState.threads.length === 0) {
      return {
        frames: [],
      };
    }
    return await state.resolver.getStackTrace(state.processState.threads[0]);
  }, [state]);

  if (isLoading) {
    return "Loading";
  }

  return <StackTraceComponent stackTrace={stackTrace} />;
}

// TODO: CSS
// TODO: arrows
