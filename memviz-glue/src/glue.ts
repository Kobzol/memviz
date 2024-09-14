import type { ExtensionToMemvizMsg } from "./messages";
import { VsCodeResolver } from "./process/resolver/vscode";
import { Memviz } from "./visualization";

export function runMemvizInVsCode() {
  const vscode = acquireVsCodeApi();
  const resolver = new VsCodeResolver(vscode);
  const memviz = new Memviz(document.getElementById("app")!);

  window.addEventListener(
    "message",
    (event: MessageEvent<ExtensionToMemvizMsg>) => {
      const message = event.data;
      if (message.kind === "visualize-state") {
        memviz.showState(message.state, resolver);
      } else {
        resolver.handleMessage(message);
      }
    },
  );
}
