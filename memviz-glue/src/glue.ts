import { ExtensionToMemvizMsg } from "./messages";
import { ProcessState } from "./process/memory";
import { ProcessResolver } from "./process/resolver/resolver";
import { VsCodeResolver } from "./process/resolver/vscode";

export function glueMemviz() {
    const vscode = acquireVsCodeApi();
    const resolver = new VsCodeResolver(vscode);

    window.addEventListener("message", (event: MessageEvent<ExtensionToMemvizMsg>) => {
        const message = event.data;
        if (message.kind === "visualize-state") {
            visualize(message.state, resolver);
        } else {
            resolver.handleMessage(message);
        }
    });
}

async function visualize(state: ProcessState, resolver: ProcessResolver) {
    const stackTrace = await resolver.getStackTrace(state.threads[0]);
    console.log("GOT STACKTRACE:", stackTrace);
}
