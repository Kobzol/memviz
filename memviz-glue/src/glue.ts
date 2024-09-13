import { MemvizMsg } from "./messages";

export function glueMemviz() {
    const vscode = acquireVsCodeApi();

    window.addEventListener("message", (event: MessageEvent<MemvizMsg>) => {
        const message = event.data;
        if (message.kind === "visualize-state") {
            console.log("Visualize state:", message.state);
        } else {
            throw new Error(`Unknown message kind ${message.kind}`);
        }
        // vscode.postMessage({
        //     message
        // });
    });
}
