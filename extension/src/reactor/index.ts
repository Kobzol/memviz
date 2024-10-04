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
import type { DebuggerSession } from "../session";
import { decodeBase64 } from "../utils";
import {
  isSetBreakpointsRequest,
  isSetFunctionBreakpointsRequest,
  isSetFunctionBreakpointsResponse,
  isStoppedEvent,
} from "./guards";
import type { Status } from "./handlers";
import { BreakpointMap, type Location } from "./locations";

export class Reactor {
  private status: Status = {
    kind: "waiting-for-set-function-breakpoints",
  };
  private trackDynamicAllocations: boolean;

  // Breakpoint management
  private breakpointMap = new BreakpointMap();

  constructor(
    private panel: vscode.WebviewPanel,
    private session: DebuggerSession,
    private gdbScriptPath: string,
    settings: Settings,
  ) {
    this.trackDynamicAllocations = settings.trackDynamicAllocations;
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
        const stopLocation = getStopLocation(message);

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

        // TODO: check if we're using GDB
        // Load helper GDB Python script
        const loadResult = await this.session.evaluate(
          `source ${this.gdbScriptPath}`,
          frameId,
        );
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
    if (message.kind === "get-stack-trace") {
      await this.performGetStackTraceRequest(message);
    } else if (message.kind === "get-places") {
      await this.performGetPlacesRequest(message);
    } else if (message.kind === "read-memory") {
      await this.performReadMemoryRequest(message);
    } else if (message.kind === "take-alloc-events") {
      await this.performTakeAllocEventsRequest(message);
    }
  }

  dispose() {
    this.panel.dispose();
  }

  private async performGetStackTraceRequest(message: GetStackTraceReq) {
    await this.sendMemvizResponse(message, async () => {
      const frames = await this.session.getStackTrace(message.threadId);
      return {
        kind: "get-stack-trace",
        data: {
          stackTrace: {
            frames,
          },
        },
      };
    });
  }

  private async performGetPlacesRequest(message: GetPlacesReq) {
    await this.sendMemvizResponse(message, async () => {
      const places = await this.session.getPlaces(message.frameIndex);
      return {
        kind: "get-places",
        data: {
          places,
        },
      };
    });
  }

  private async performReadMemoryRequest(message: ReadMemoryReq) {
    await this.sendMemvizResponse(message, async () => {
      const result = await this.session.readMemory(
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
    });
  }

  private async performTakeAllocEventsRequest(message: TakeAllocEventsReq) {
    const [_, frameId] = await this.session.getCurrentThreadAndFrameId();
    const events = await this.session.takeAllocEvents(frameId);
    await this.sendMemvizResponse(message, async () => {
      return {
        kind: "take-alloc-events",
        data: {
          events,
        },
      };
    });
  }

  private async onThreadStopped() {
    const response = await this.session.getThreads();
    const stackTrace = await this.session.getStackTrace(
      response.threads[0].id,
      true,
    );
    const frameId = stackTrace[0].id;
    const stackAddressRange = await this.session.getStackAddressRange(frameId);

    this.sendMemvizEvent({
      kind: "process-stopped",
      state: {
        stackTrace: {
          frames: stackTrace,
        },
        stackAddressRange,
      },
    });
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
}

// Mangles the event so that the client (VSCode) does not observe it
function ignoreEvent(message: DebugProtocol.Event) {
  // console.log("Ignoring message", message);
  message.type = "invalid";
}

function getStopLocation(event: DebugProtocol.StoppedEvent): Location {
  return {
    source: (event.body as any).source as DebugProtocol.Source | undefined,
    line: (event.body as any).line,
  };
}
