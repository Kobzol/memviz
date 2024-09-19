import createPanZoom from "panzoom";
import type { ProcessState } from "process-def";
import { createApp } from "vue";
import type { ProcessResolver } from "../resolver/resolver";
import App from "./app.vue";
import { appState } from "./store";

export class Memviz {
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

    createApp(App).mount(root);
  }

  async showState(processState: ProcessState, resolver: ProcessResolver) {
    console.debug("Root state changed");
    appState.value = {
      processState,
      resolver,
    };
  }
}
