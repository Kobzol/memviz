import createPanZoom from "panzoom";
import type { ProcessState, SessionType } from "process-def";
import { createApp, triggerRef } from "vue";
import App from "./app.vue";
import { appState, processResolver } from "./store";
import "tippy.js/dist/tippy.css";
import type { MemoryAllocEvent } from "../messages";
import type { ProcessResolver } from "../resolver/resolver";
import { strToAddress } from "../utils";
import { valueState } from "./debugpy/store";
import { allocationState } from "./gdb/store";

export class Memviz {
  constructor(root: HTMLElement) {
    const app = createApp(App);
    app.mount(root);

    const panzoomOwner = document.documentElement;
    let isSyntheticPanMouseDown = false;

    panzoomOwner.addEventListener(
      "mousedown",
      (event) => {
        if (event.button !== 1) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const target = event.target;
        if (target instanceof EventTarget) {
          isSyntheticPanMouseDown = true;
          try {
            const leftButtonMouseDown = new MouseEvent("mousedown", {
              bubbles: true,
              cancelable: true,
              clientX: event.clientX,
              clientY: event.clientY,
              screenX: event.screenX,
              screenY: event.screenY,
              button: 0,
              buttons: 1,
              altKey: event.altKey,
              ctrlKey: event.ctrlKey,
              metaKey: event.metaKey,
              shiftKey: event.shiftKey,
              view: window,
            });

            target.dispatchEvent(leftButtonMouseDown);
          } finally {
            isSyntheticPanMouseDown = false;
          }
        }
      },
      { capture: true },
    );

    panzoomOwner.addEventListener(
      "auxclick",
      (event) => {
        if (event.button !== 1) {
          return;
        }

        event.preventDefault();
      },
      { capture: true },
    );

    createPanZoom(document.body, {
      smoothScroll: false,
      onDoubleClick: (_e) => {
        return false; // tells the library to not preventDefault, and not stop propagation
      },
      beforeMouseDown: (e) => {
        const shouldIgnore = e.button !== 0 || !isSyntheticPanMouseDown;
        return shouldIgnore;
      },
      zoomDoubleClickSpeed: 1,
    });
  }

  async showState(
    processState: ProcessState,
    resolver: ProcessResolver,
    sessionType: SessionType,
  ) {
    console.debug("Root state changed");
    valueState.value.clear();
    appState.value = {
      processState,
      sessionType,
    };
    processResolver.value = resolver;

    const events = await resolver.gdb.takeAllocEvents();
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
