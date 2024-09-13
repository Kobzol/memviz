import * as vscode from "vscode";

import { DebugProtocol } from '@vscode/debugprotocol';
import { ExtractBody } from "./utils";

export class Context {
    constructor(private panel: vscode.WebviewPanel, private session: vscode.DebugSession) {

    }

    dispose() {
        this.panel.dispose();
    }

    async handleDebugMessage(message: any) {
        const event = message["event"];
        if (event === "stopped") {
            console.log("Program stopped, figuring out its state");
            // TODO: transform type to extract `body` key
            const response: ExtractBody<DebugProtocol.ThreadsResponse> = await this.session.customRequest("threads");
            let a: DebugProtocol.ThreadsResponse;
            const thread = response.threads[0];
            const stackTrace: ExtractBody<DebugProtocol.StackTraceResponse> = await this.session.customRequest("stackTrace");
            const stackFrames = stackTrace.stackFrames;

            console.log("RESPONSE:", response);
        } else {
            // console.log(`Debug event: ${event}`);
        }
    }
}
