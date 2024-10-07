import createPanZoom from "panzoom";
import type { ProcessState } from "process-def";
import { createApp, triggerRef } from "vue";
import type { ProcessResolver } from "../resolver/resolver";
import App from "./app.vue";
import { allocationState, appState } from "./store";
import "tippy.js/dist/tippy.css";
import type { MemoryAllocEvent } from "../messages";
import { strToAddress } from "../utils";

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

    const events = await resolver.takeAllocEvents();
    processAllocEvents(events);
  }
}

function processAllocEvents(events: MemoryAllocEvent[]) {
  if (events.length > 0) {
    const tracker = allocationState.value;
    for (const event of events) {
      if (event.kind === "mem-allocated") {
        console.debug(
          `Heap memory allocated at ${event.address} (${event.size}B)`,
        );
        tracker.allocateMemory(strToAddress(event.address), event.size);
      } else if (event.kind === "mem-freed") {
        console.debug(`Heap memory freed at ${event.address}`);
        tracker.freeMemory(strToAddress(event.address));
      }
    }

    triggerRef(allocationState);
  }
}
