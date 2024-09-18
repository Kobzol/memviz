import type { ProcessState } from "process-def";
import type { ExtensionToMemvizMsg } from "./messages";
import { EagerResolver } from "./resolver/eager";
import { VsCodeResolver } from "./resolver/vscode";
import { Memviz } from "./visualization";
import { measureAsync } from "./utils";

export type {
  ExtensionToMemvizMsg,
  ExtensionToMemvizResponse,
  GetStackTraceReq,
  GetPlacesReq as GetVariablesReq,
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
        // const stackTrace = await resolver.getStackTrace(
        //   message.state.threads[0],
        // );

        const vars = await measureAsync("getPlaces", async () => {
          return await resolver.getPlaces(0);
        });
        const futures: any[] = [];
        for (const variable of vars) {
          futures.push(
            resolver.readMemory(variable.address, variable.type.size),
          );
        }

        // const data = await measureAsync("readMemory", async () => {
        // return resolver.readMemory(vars[0].address, vars[0].type.size);
        // });
        // console.log(data);

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
