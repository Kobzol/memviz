import type { ProcessState } from "process-def";
import type { ExtensionToMemvizMsg } from "./messages";
import { EagerResolver } from "./resolver/eager";
import { VsCodeResolver } from "./resolver/vscode";
import { Memviz } from "./visualization";

export type {
  ExtensionToMemvizMsg,
  ExtensionToMemvizResponse,
  GetStackTraceReq,
  GetVariablesReq,
  MemvizToExtensionMsg,
} from "./messages";
export { PlaceKind } from "process-def";

function runMemvizInVsCode() {
  const vscode = acquireVsCodeApi();
  const resolver = new VsCodeResolver(vscode);
  const memviz = new Memviz(document.getElementById("app")!);

  window.addEventListener(
    "message",
    async (event: MessageEvent<ExtensionToMemvizMsg>) => {
      const message = event.data;
      if (message.kind === "visualize-state") {
        const stackTrace = await resolver.getStackTrace(
          message.state.threads[0],
        );
        const vars = await resolver.getPlaces(stackTrace.frames[0].index);
        console.log(vars);

        // memviz.showState(message.state, resolver);
      } else if (
        message.kind === "mem-allocated" ||
        message.kind === "mem-freed"
      ) {
        // TODO: handle memory allocation events
      } else {
        resolver.handleMessage(message);
      }
    },
  );
}

function runMemVizTest() {
  const root = document.getElementById("app")!;
  const memviz = new Memviz(root);

  const processState: ProcessState = {
    threads: [0],
  };
  const resolver = new EagerResolver({
    0: {
      stackTrace: {
        frames: [
          {
            id: 0,
            name: "Frame 0",
          },
          {
            id: 1,
            name: "Frame 1",
          },
        ],
      },
    },
  });
  memviz.showState(processState, resolver);
}

// runMemVizTest();
runMemvizInVsCode();
