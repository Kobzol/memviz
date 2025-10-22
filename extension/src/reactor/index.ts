import * as vscode from "vscode";

import path from "path";
import type { DebugProtocol } from "@vscode/debugprotocol";
import type {
  ExtensionToMemvizMsg,
  ExtensionToMemvizResponse,
  MemvizToExtensionMsg,
} from "memviz-ui";
import type { FrameId } from "process-def";
import type { Settings } from "../menu/settings";
import { DebugpyDebuggerSession } from "../session/debugpy";
import type { Evaluator } from "../session/evaluator/evaluator";
import { GDBDebuggerSession } from "../session/gdb";
import type { DebuggerSession } from "../session/session";
import { SessionType } from "../session/sessionType";
import {
  isSetBreakpointsRequest,
  isSetFunctionBreakpointsRequest,
  isSetFunctionBreakpointsResponse,
  isStoppedEvent,
} from "./guards";
import type { Status } from "./handlers";
import { BreakpointMap, type Location } from "./locations";
import type { WebviewMessageHandler } from "./webviewMessageHandler/webviewMessageHandler";

export class Reactor<
  TEvaluator extends Evaluator,
  TSession extends DebuggerSession<TEvaluator>,
> {
  private status: Status = {
    kind: "waiting-for-set-function-breakpoints",
  };
  private trackDynamicAllocations: boolean;

  // Breakpoint management
  private breakpointMap = new BreakpointMap();

  private webviewMessageHandler: WebviewMessageHandler<TSession>;

  constructor(
    private panel: vscode.WebviewPanel,
    private session: TSession,
    settings: Settings,
  ) {
    this.trackDynamicAllocations = settings.trackDynamicAllocations;

    this.webviewMessageHandler = session.createWebviewMessageHandler();
  }

  applyMessageChanges(message: DebugProtocol.ProtocolMessage): void {
    if (this.session.getSessionType() === SessionType.GDB) {
      // The client sends setFunctionBreakpoints at the very beginning of the debug session.
      // Add main to the list, so that we can perform some basic initialization at the start
      // of the debugged program.
      if (isSetFunctionBreakpointsRequest(message)) {
        message.arguments.breakpoints.push({
          name: "main",
        });
      }
    }
  }

  async handleMessageFromClient(message: DebugProtocol.ProtocolMessage) {
    // Save the most recent client breakpoints for a given source file
    if (isSetBreakpointsRequest(message)) {
      this.breakpointMap.setSourceBreakpoints(
        message.arguments.source,
        message.arguments.breakpoints ?? [],
      );
    }
  }

  async handleMessageToClient(message: DebugProtocol.ProtocolMessage) {
    if (this.status.kind === "waiting-for-set-function-breakpoints") {
      if (isSetFunctionBreakpointsResponse(message)) {
        this.handleSetFunctionBreakpointsResponse(message);
      }
    } else if (this.status.kind === "waiting-for-main-breakpoint") {
      if (isStoppedEvent(message) && message.body.reason === "breakpoint") {
        const stopLocation = await this.getStopLocation(message);

        // If the user also has a breakpoint here, do not ignore it
        const hasUserBreakpoint =
          this.breakpointMap.hasUserBreakpoint(stopLocation);
        if (!hasUserBreakpoint) {
          ignoreEvent(message);
        }

        if (!(await this.checkDebugInfo(stopLocation))) {
          return;
        }

        const [threadId, frameId] =
          await this.session.getCurrentThreadAndFrameId();

        const loadResult = await this.session.initEvaluator(frameId);
        console.assert(loadResult.result.trim() === "");
        await this.handleInitialBreakpointEvent(frameId, stopLocation);

        if (hasUserBreakpoint) {
          await this.onThreadStopped();
        } else {
          await this.session.continue(threadId);
        }
      }
    } else if (this.status.kind === "initialized") {
      if (isStoppedEvent(message)) {
        const reason = message.body.reason;
        if (
          reason === "step" ||
          reason === "breakpoint" ||
          reason === "pause"
        ) {
          await this.onThreadStopped();
        }
      }
    }
  }

  // Returns true if it looks like debug info is present in the debugged process,
  // based on the passed location.
  async checkDebugInfo(stopLocation: Location): Promise<boolean> {
    if (stopLocation.source === undefined) {
      vscode.window.showInformationMessage(
        "Source code location not found. Is your program compiled with debug symbols?",
      );
      this.status = {
        kind: "initialized",
      };

      const [threadId, _] = await this.session.getCurrentThreadAndFrameId();
      await this.session.continue(threadId);
      return false;
    }
    return true;
  }

  private handleSetFunctionBreakpointsResponse(
    message: DebugProtocol.SetFunctionBreakpointsResponse,
  ) {
    if (this.session.getSessionType() === SessionType.GDB) {
      // The last breakpoint is the one we artificially created
      const breakpoints = message.body.breakpoints;
      console.assert(breakpoints.length > 0);
    }
    this.status = {
      kind: "waiting-for-main-breakpoint",
    };
  }

  private async handleInitialBreakpointEvent(
    frameId: FrameId,
    stopLocation: Location,
  ) {
    // GDB: The program has stopped at main
    // Debugpy: The program has stopped at the first breakpoint
    // Perform all initialization actions
    if (
      this.session instanceof GDBDebuggerSession &&
      this.trackDynamicAllocations
    ) {
      await this.session.initDynAllocTracking(frameId);
    } else if (this.session instanceof DebugpyDebuggerSession) {
      await this.session.configureEvaluator(frameId, stopLocation);
    }

    // We need to change the status BEFORE starting the asynchronous continue
    this.status = { kind: "initialized" };
  }

  /// This method handles requests from the webview.
  /// It asks DAP for information and sends responses back to the webview.
  async handleWebviewMessage(message: MemvizToExtensionMsg) {
    const messageCallback = this.webviewMessageHandler.getHandleCallback(
      message,
      this.session,
    );
    if (messageCallback !== null)
      await this.sendMemvizResponse(message, messageCallback);
  }

  dispose() {
    this.panel.dispose();
  }

  private async onThreadStopped() {
    const extensionToMemvizMsg =
      await this.webviewMessageHandler.getProcessStoppedMessage(this.session);
    this.sendMemvizEvent(extensionToMemvizMsg);
  }

  private async sendMemvizEvent(msg: ExtensionToMemvizMsg) {
    console.log("Sending memviz event", msg);
    await this.panel.webview.postMessage(msg);
  }

  private async sendMemvizResponse(
    request: MemvizToExtensionMsg,
    fn: () => Promise<
      Omit<ExtensionToMemvizResponse, "requestId" | "resolverId">
    >,
  ) {
    try {
      const response = await fn();
      const message = {
        ...response,
        requestId: request.requestId,
        resolverId: request.resolverId,
      } as ExtensionToMemvizResponse;
      await this.panel.webview.postMessage(message);
    } catch (e: any) {
      console.error("Error while handing request", request, e);
      vscode.window.showErrorMessage(`Request failed: ${e}`);
      await this.panel.webview.postMessage({
        kind: "error",
        error: e.toString(),
        requestId: request.requestId,
        resolverId: request.resolverId,
      } satisfies ExtensionToMemvizResponse);
    }
  }

  private async getStopLocation(
    event: DebugProtocol.StoppedEvent,
  ): Promise<Location> {
    const result = {
      source: (event.body as any).source as DebugProtocol.Source | undefined,
      line: (event.body as any).line,
    };
    if (result.source === undefined) {
      const stackTrace = await this.session.getStackTrace(
        event.body.threadId ?? -1,
        true,
      );
      const rawSource = stackTrace[0]?.file;
      let source = undefined;
      if (rawSource !== null) {
        // URI may include remote prefix
        const uri = vscode.Uri.parse(rawSource);
        source = {
          name: path.basename(uri.fsPath),
          path: uri.fsPath,
        };
      }
      return {
        source: source,
        line: stackTrace[0].line,
      };
    }
    return result;
  }
}

// Mangles the event so that the client (VSCode) does not observe it
function ignoreEvent(message: DebugProtocol.Event) {
  // console.log("Ignoring message", message);
  message.type = "invalid";
}
