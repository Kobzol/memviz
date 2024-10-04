import createPanZoom from "panzoom";
import type { ProcessState } from "process-def";
import { createApp } from "vue";
import type { ProcessResolver } from "../resolver/resolver";
import App from "./app.vue";
import { appState } from "./store";
import "tippy.js/dist/tippy.css";

export class Memviz {
  constructor(root: HTMLElement) {
    const app = createApp(App);
    app.mount(root);
    createPanZoom(document.body, {
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
  }

  async showState(processState: ProcessState, resolver: ProcessResolver) {
    console.debug("Root state changed");
    appState.value = {
      processState,
      resolver,
    };
    // TODO: read heap memory from the resolver
  }
}
