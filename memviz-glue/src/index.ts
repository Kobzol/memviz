import type { ProcessState } from "./process/memory";
import { EagerResolver } from "./process/resolver/eager";
import { Memviz } from "./visualization";

export { ExtensionToMemvizMsg } from "./messages";

// function runMemvizInVsCode() {
//   const vscode = acquireVsCodeApi();
//   const resolver = new VsCodeResolver(vscode);
//   const memviz = new Memviz(document.getElementById("app")!);

//   window.addEventListener(
//     "message",
//     (event: MessageEvent<ExtensionToMemvizMsg>) => {
//       const message = event.data;
//       if (message.kind === "visualize-state") {
//         memviz.showState(message.state, resolver);
//       } else {
//         resolver.handleMessage(message);
//       }
//     },
//   );
// }

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
runMemVizTest();
