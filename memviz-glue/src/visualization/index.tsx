import { Provider, createStore, useAtomValue } from "jotai";
import createPanZoom from "panzoom";
import type { ProcessState } from "process-def";
import * as React from "react";
import { createRoot } from "react-dom/client";
import type { ProcessResolver } from "../resolver/resolver";
import { StackTraceComponent } from "./components/stackTrace";
import { rootStateAtom } from "./state";

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
  return <StackTraceComponent stackTrace={state.processState.stackTrace} />;
}

// TODO: CSS
// TODO: arrows
