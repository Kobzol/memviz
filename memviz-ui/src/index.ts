import { PlaceKind } from "process-def";
import type { WebviewApi } from "vscode-webview";
import type { ExtensionToMemvizMsg } from "./messages";
import { CachingResolver } from "./resolver/cache";
import { ProcessBuilder, typeFloat32, typeUint32 } from "./resolver/eager";
import { VsCodeResolver } from "./resolver/vscode";
import { Memviz } from "./visualization";

export type {
  ExtensionToMemvizMsg,
  ExtensionToMemvizResponse,
  MemvizToExtensionRequest,
  GetStackTraceReq,
  GetPlacesReq,
  MemvizToExtensionMsg,
  ReadMemoryReq,
} from "./messages";
export { PlaceKind } from "process-def";

function runMemvizInVsCode(vscode: WebviewApi<unknown>) {
  let resolverId = 0;
  let resolver: CachingResolver<VsCodeResolver> = new CachingResolver(
    new VsCodeResolver(vscode, resolverId),
  );
  const memviz = new Memviz(document.getElementById("app")!);

  window.addEventListener(
    "message",
    async (event: MessageEvent<ExtensionToMemvizMsg>) => {
      const message = event.data;
      if (message.kind === "process-stopped") {
        // We need to reset the resolver to break caches
        resolverId++;
        resolver = new CachingResolver(new VsCodeResolver(vscode, resolverId));
        memviz.showState(message.state, resolver);
      } else if (
        message.kind === "mem-allocated" ||
        message.kind === "mem-freed"
      ) {
        // TODO: handle memory allocation events
      } else {
        resolver.inner.handleMessage(message);
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
  state.memory.dump();
  memviz.showState(state, new CachingResolver(resolver));
}

try {
  const vscode = acquireVsCodeApi();
  runMemvizInVsCode(vscode);
} catch {
  runMemVizTest();
}
