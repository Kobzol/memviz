import * as vscode from "vscode";

import { DebugProtocol } from "@vscode/debugprotocol";
import { ExtractBody } from "./utils";
import { MemvizMsg } from "../../memviz-glue";

export class Context {
    constructor(private panel: vscode.WebviewPanel, private session: vscode.DebugSession) {}

    public dispose() {
        this.panel.dispose();
    }

    public async handleDebugMessage(message: any) {
        const event = message["event"];
        if (event === "stopped") {
            await this.visualizeState();
        }
    }

    public handleWebviewMessage(message: any) {
        console.log("Webview message:", message);
    }

    async visualizeState() {
        console.log("Program stopped, figuring out its state");
        const response: ExtractBody<DebugProtocol.ThreadsResponse> = await this.session.customRequest("threads");

        const thread = response.threads[0];
        const stackTrace: ExtractBody<DebugProtocol.StackTraceResponse> = await this.session.customRequest("stackTrace", {
            threadId: thread.id
        });
        const stackFrames = stackTrace.stackFrames;
        this.sendMemvizMessage({
            kind: "visualize-state",
            state: {
                threads: [{
                    frames: stackFrames.map(frame => ({
                        id: frame.id,
                        name: frame.name
                    }))
                }]
            }
        });
    }

    sendMemvizMessage(msg: MemvizMsg) {
        this.panel.webview.postMessage(msg);
    }
}
