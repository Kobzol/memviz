import { PlaceKind } from "process-def";
import type { ExtensionToMemvizMsg } from "./messages";
import { ProcessBuilder, typeFloat32, typeUint32 } from "./resolver/eager";
import { VsCodeResolver } from "./resolver/vscode";
import { Memviz } from "./visualization";

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
      if (message.kind === "process-stopped") {
        memviz.showState(message.state, resolver);
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

async function runMemVizTest() {
  const root = document.getElementById("app")!;
  const memviz = new Memviz(root);

  const builder = new ProcessBuilder();
  builder.startFrame("main", 0);
  builder.place("a", BigInt(4), typeUint32()).setUint32(50);
  builder.place("b", BigInt(8), typeUint32()).setUint32(42);
  builder.place("c", BigInt(12), typeFloat32()).setFloat32(1.58);
  builder.place("d", BigInt(16), typeFloat32()).setFloat32(4);
  builder.startFrame("foo", 32);
  builder.place("a", BigInt(4), typeUint32()).setUint32(50);
  builder
    .place("b", BigInt(8), typeUint32(), PlaceKind.Variable, false)
    .setUint32(42);

  const [state, resolver] = builder.build();
  console.log(state);
  memviz.showState(state, resolver);
}

runMemVizTest();
// runMemvizInVsCode();
