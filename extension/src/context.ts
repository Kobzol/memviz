import * as vscode from "vscode";

import { DebugProtocol } from "@vscode/debugprotocol";
import { ExtractBody } from "./utils";
import { ExtensionToMemvizMsg } from "../../memviz-glue";
import { ExtensionToMemvizResponse, MemvizToExtensionMsg } from "memviz-glue/dist/messages";

export class Context {
    constructor(private panel: vscode.WebviewPanel, private session: vscode.DebugSession) {}

    dispose() {
        this.panel.dispose();
    }

    async handleDebugMessage(message: any) {
        const event = message["event"];
        if (event === "stopped") {
            await this.onProgramStopped();
        }
    }

    async handleWebviewMessage(message: MemvizToExtensionMsg) {
        if (message.kind === "get-stack-trace") {
            const response: ExtractBody<DebugProtocol.StackTraceResponse> = await this.session.customRequest("stackTrace", {
                threadId: message.threadId
            });
            this.sendMemvizResponse({
                kind: "get-stack-trace",
                requestId: message.requestId,
                data: {
                    stackTrace: {
                        frames: response.stackFrames.map(frame => ({
                            id: frame.id,
                            name: frame.name
                        }))
                    }
                }
            });
        }
    }

    private async onProgramStopped() {
        const response: ExtractBody<DebugProtocol.ThreadsResponse> = await this.session.customRequest("threads");
        this.sendMemvizEvent({
            kind: "visualize-state",
            state: {
                threads: response.threads.map(t => t.id)
            }
        });
    }

    private sendMemvizEvent(msg: ExtensionToMemvizMsg) {
        this.panel.webview.postMessage(msg);
    }

    private sendMemvizResponse(response: ExtensionToMemvizResponse) {
        this.panel.webview.postMessage(response);
    }
}
