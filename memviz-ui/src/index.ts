import { SessionType } from "process-def";
import type { WebviewApi } from "vscode-webview";
import type { ExtensionToMemvizMsg } from "./messages";
import { CachingResolver } from "./resolver/cache";
import { VsCodeResolver } from "./resolver/vscode";
import { buildStruct } from "./test-programs";
import { Memviz } from "./visualization";

export type {
  ExtensionToMemvizMsg,
  ExtensionToMemvizResponse,
  GetStackTraceRes,
  MemoryAllocEvent,
  MemvizToExtensionMsg,
  GetStackTraceReq,
  GetPlacesReq,
  ReadMemoryReq,
  TakeAllocEventsReq,
} from "./messages";
export type { InternedPlaceList } from "./type";
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
        const innerResolver = new VsCodeResolver(vscode, resolverId);
        resolver = new CachingResolver(innerResolver);
        memviz.showState(message.state, resolver, message.sessionType);
      } else {
        resolver.inner.handleMessage(message);
      }
    },
  );
}

async function runMemVizTest() {
  const root = document.getElementById("app")!;
  const memviz = new Memviz(root);

  const builder = buildStruct();

  const [state, resolver] = builder.build();
  state.memory.dump();
  memviz.showState(state, new CachingResolver(resolver), SessionType.GDB);
}

try {
  const vscode = acquireVsCodeApi();
  runMemvizInVsCode(vscode);
} catch {
  runMemVizTest();
}
