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
        console.log(stackTrace);
        const vars = await resolver.getVariables(stackTrace.frames[0].id);
        console.log(vars);

        // memviz.showState(message.state, resolver);
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
