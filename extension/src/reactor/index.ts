import * as vscode from "vscode";

import type { DebugProtocol } from "@vscode/debugprotocol";
import type {
  ExtensionToMemvizMsg,
  ExtensionToMemvizResponse,
  GetPlacesReq,
  GetStackTraceReq,
  MemvizToExtensionMsg,
  ReadMemoryReq,
  TakeAllocEventsReq,
} from "memviz-ui";
import type { FrameId } from "process-def";
import type { Settings } from "../menu/settings";
import type { DebuggerSession, DebugpyDebuggerSession, GDBDebuggerSession } from "../session";
import { decodeBase64 } from "../utils";
import {
  isSetBreakpointsRequest,
  isSetFunctionBreakpointsRequest,
  isSetFunctionBreakpointsResponse,
  isStoppedEvent,
} from "./guards";
import type { Status } from "./handlers";
import { BreakpointMap, type Location } from "./locations";
import path from "path";
import { SessionType } from "../session/sessionType";
import type { DebugpyProcessStoppedEvent, GDBProcessStoppedEvent, ProcessStoppedEvent } from "memviz-ui/dist/messages";

interface WebviewMessageHandler<T extends DebuggerSession> {
  getHandleCallback(message: MemvizToExtensionMsg, session: T): (() => Promise<Omit<ExtensionToMemvizResponse, "requestId" | "resolverId">>) | null;
  getProcessStoppedMessage(session: T): Promise<ProcessStoppedEvent>;
}

class GDBWebviewMessageHandler implements WebviewMessageHandler<GDBDebuggerSession> {
  public getHandleCallback(message: MemvizToExtensionMsg, session: GDBDebuggerSession) {
    if (message.kind === "get-stack-trace") {
      return this.performGetStackTraceRequest(message, session);
    } if (message.kind === "get-places") {
      return this.performGetPlacesRequest(message, session);
    } if (message.kind === "read-memory") {
      return this.performReadMemoryRequest(message, session);
    } if (message.kind === "take-alloc-events") {
      return this.performTakeAllocEventsRequest(message, session);
    }
    return null;
  }

  public async getProcessStoppedMessage(session: GDBDebuggerSession): Promise<GDBProcessStoppedEvent> {
    const response = await session.getThreads();
    const stackTrace = await session.getStackTrace(
      response.threads[0].id,
      true,
    );
    const frameId = stackTrace[0].id;
    const stackAddressRange = await session.getStackAddressRange(frameId);

    return {
      kind: "process-stopped",
      type: "gdb",
      state: {
        stackTrace: {
          frames: stackTrace,
        },
        stackAddressRange,
      },
    } as const;
  }

  private performGetStackTraceRequest(message: GetStackTraceReq, session: GDBDebuggerSession): () => Promise<Omit<ExtensionToMemvizResponse, "requestId" | "resolverId">> {
    return async () => {
      const frames = await session.getStackTrace(message.threadId);
      return {
        kind: "get-stack-trace",
        data: {
          stackTrace: {
            frames,
          },
        },
      };
    }
  }

  private performGetPlacesRequest(message: GetPlacesReq, session: GDBDebuggerSession): () => Promise<Omit<ExtensionToMemvizResponse, "requestId" | "resolverId">> {
    return async () => {
      const places = await session.getPlaces(message.frameIndex);
      return {
        kind: "get-places",
        data: {
          places,
        },
      };
    }
  }

  private performReadMemoryRequest(message: ReadMemoryReq, session: GDBDebuggerSession): () => Promise<Omit<ExtensionToMemvizResponse, "requestId" | "resolverId">> {
    return async () => {
      const result = await session.readMemory(
        message.address,
        message.size,
      );
      const data = await decodeBase64(result.data ?? "");
      return {
        kind: "read-memory",
        data: {
          data,
        },
      };
    }
  }

  private performTakeAllocEventsRequest(message: TakeAllocEventsReq, session: GDBDebuggerSession): () => Promise<Omit<ExtensionToMemvizResponse, "requestId" | "resolverId">> {
    return async () => {
      const [_, frameId] = await session.getCurrentThreadAndFrameId();
      const events = await session.takeAllocEvents(frameId);
      return {
        kind: "take-alloc-events",
        data: {
          events,
        },
      };
    };
  }
}

class PythonWebviewMessageHandler implements WebviewMessageHandler<DebugpyDebuggerSession> {
  public getHandleCallback(message: MemvizToExtensionMsg, session: DebugpyDebuggerSession) {
    if (message.kind === "get-places") {
      return this.performGetPlacesRequest(message, session);
    }
    return null;
  }
  private async fetchVariables(variablesReference: number, session: DebugpyDebuggerSession): Promise<any[]> {
    const { variables } = await session.getVariables(variablesReference);

    return Promise.all(
      variables.map(async (v) => {
        const children = (v.variablesReference !== 0 && v.name !== "special variables" && v.name !== "function variables")
          ? await this.fetchVariables(v.variablesReference, session)
          : [];
        return { ...v, children };
      })
    );
  }
  public async getProcessStoppedMessage(session: DebugpyDebuggerSession): Promise<DebugpyProcessStoppedEvent> {
    const response = await session.getThreads();
    const stackTrace = await session.getStackTrace(
      response.threads[0].id,
      true,
    );

    const frameId = stackTrace[0].id;
    const scopes = await session.getScopes(frameId);
    const variables = await Promise.all(
      scopes.scopes.map(async (scope) => ({
        scope,
        variables: await this.fetchVariables(
          scope.variablesReference,
          session
        ),
      }))
    );
    console.log("variables", variables);

    const places = await session.getPlaces(frameId);
    console.log(`places: ${places}`);

    return {
      kind: "process-stopped",
      type: "debugpy",
    } as const;
  }
  private performGetPlacesRequest(message: GetPlacesReq, session: DebugpyDebuggerSession): () => Promise<Omit<ExtensionToMemvizResponse, "requestId" | "resolverId">> {
    return async () => {
      const places = await session.getPlaces(message.frameIndex);
      console.log(`places: ${places}`);
      return {
        kind: "get-places",
        data: {
          places,
        },
      };
    }
  }
}

export class Reactor {
  private status: Status = {
    kind: "waiting-for-set-function-breakpoints",
  };
  private trackDynamicAllocations: boolean;

  // Breakpoint management
  private breakpointMap = new BreakpointMap();

  private webviewMessageHandler: WebviewMessageHandler<DebuggerSession>;

  constructor(
    private panel: vscode.WebviewPanel,
    private session: DebuggerSession,
    settings: Settings,
  ) {
    this.trackDynamicAllocations = settings.trackDynamicAllocations;

    const sessionType = session.getSessionType();
    if (sessionType === SessionType.GDB) {
      this.webviewMessageHandler = new GDBWebviewMessageHandler();
    } else if (sessionType === SessionType.Debugpy) {
      this.webviewMessageHandler = new PythonWebviewMessageHandler();
    } else {
      throw new Error(`Unsupported session type: ${sessionType}`);
    }
  }

  async handleMessageFromClient(message: DebugProtocol.ProtocolMessage) {
    // The client sends setFunctionBreakpoints at the very beginning of the debug session.
    // Add main to the list, so that we can perform some basic initialization at the start
    // of the debugged program.
    if (
      isSetFunctionBreakpointsRequest(message) &&
      this.status.kind === "waiting-for-set-function-breakpoints"
    ) {
      message.arguments.breakpoints.push({
        name: "main",
      });
    }

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
        await this.handleMainBreakpointEvent(frameId);

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
    // The last breakpoint is the one we artificially created
    const breakpoints = message.body.breakpoints;
    console.assert(breakpoints.length > 0);
    this.status = {
      kind: "waiting-for-main-breakpoint",
    };
  }

  private async handleMainBreakpointEvent(frameId: FrameId) {
    // The program has stopped at main
    // Perform all initialization actions

    if (this.trackDynamicAllocations) {
      await this.session.initDynAllocTracking(frameId);
    }

    // We need to change the status BEFORE starting the asynchronous continue
    this.status = { kind: "initialized" };
  }

  /// This method handles requests from the webview.
  /// It asks DAP for information and sends responses back to the webview.
  async handleWebviewMessage(message: MemvizToExtensionMsg) {
    const messageCallback = this.webviewMessageHandler.getHandleCallback(message, this.session);
    if (messageCallback !== null)
      await this.sendMemvizResponse(message, messageCallback);
  }

  dispose() {
    this.panel.dispose();
  }

  private async onThreadStopped() {
    const extensionToMemvizMsg = await this.webviewMessageHandler.getProcessStoppedMessage(this.session);
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

  private async getStopLocation(event: DebugProtocol.StoppedEvent): Promise<Location> {
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
          path: uri.fsPath
        }
      }
      return {
        source: source,
        line: stackTrace[0].line
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
