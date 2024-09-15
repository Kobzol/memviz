import type * as vscode from "vscode";

import type { DebugProtocol } from "@vscode/debugprotocol";
import type {
  ExtensionToMemvizResponse,
  GetStackTraceReq,
  GetVariablesReq,
  MemvizToExtensionMsg,
} from "memviz-glue";
import type { ExtensionToMemvizMsg } from "memviz-glue";
import type { ExtractBody } from "./utils";
import { PlaceKind } from "process-def";

export class Context {
  constructor(
    private panel: vscode.WebviewPanel,
    private session: vscode.DebugSession,
  ) {}

  dispose() {
    this.panel.dispose();
  }

  async handleDebugMessage(message: any) {
    const event = message.event;
    if (event === "stopped") {
      await this.onProgramStopped();
    }
  }

  /// This method handles requests from the webview.
  /// It asks DAP for information and sends responses back to the webview.
  async handleWebviewMessage(message: MemvizToExtensionMsg) {
    if (message.kind === "get-stack-trace") {
      this.getStackTraceRequest(message);
    } else if (message.kind === "get-variables") {
      this.getVariablesRequest(message);
    }
  }

  private async getStackTraceRequest(message: GetStackTraceReq) {
    const response: ExtractBody<DebugProtocol.StackTraceResponse> =
      await this.session.customRequest("stackTrace", {
        threadId: message.threadId,
      });
    this.sendMemvizResponse({
      kind: "get-stack-trace",
      requestId: message.requestId,
      data: {
        stackTrace: {
          frames: response.stackFrames.map((frame) => ({
            id: frame.id,
            name: frame.name,
            instruction_pointer: frame.instructionPointerReference!,
          })),
        },
      },
    });
  }

  private async getVariablesRequest(message: GetVariablesReq) {
    const response: ExtractBody<DebugProtocol.ScopesResponse> =
      await this.session.customRequest("scopes", {
        frameId: message.frameId,
      });
    const places = [];
    for (const scope of response.scopes) {
      let kind = PlaceKind.Variable;
      if (scope.presentationHint === "arguments") {
        kind = PlaceKind.Parameter;
      } else continue;

      const res: ExtractBody<DebugProtocol.VariablesResponse> =
        await this.session.customRequest("variables", {
          variablesReference: scope.variablesReference,
        });
      console.log(res);
    }
  }

  private async onProgramStopped() {
    const response: ExtractBody<DebugProtocol.ThreadsResponse> =
      await this.session.customRequest("threads");
    this.sendMemvizEvent({
      kind: "visualize-state",
      state: {
        threads: response.threads.map((t) => t.id),
      },
    });
  }

  private sendMemvizEvent(msg: ExtensionToMemvizMsg) {
    this.panel.webview.postMessage(msg);
  }

  private sendMemvizResponse(response: ExtensionToMemvizResponse) {
    this.panel.webview.postMessage(response);
  }
}
