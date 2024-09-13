export interface Message {
    kind: string;
}

const vscode = acquireVsCodeApi();

window.addEventListener("message", (event: MessageEvent<any>) => {
    const message: Message = event.data;
    console.log("Received message", message);
    // vscode.postMessage({
    // message
    // });
});
