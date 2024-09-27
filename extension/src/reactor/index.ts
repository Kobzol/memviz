import * as vscode from "vscode";

import type { DebugProtocol } from "@vscode/debugprotocol";
import type {
  ExtensionToMemvizMsg,
  ExtensionToMemvizResponse,
  GetPlacesReq,
  GetStackTraceReq,
  MemvizToExtensionMsg,
  MemvizToExtensionRequest,
  ReadMemoryReq,
} from "memviz-ui";
import type { FrameId } from "process-def";
import type { DebuggerSession } from "../session";
import { decodeBase64 } from "../utils";
import {
  isNextRequest,
  isSetBreakpointsRequest,
  isSetFunctionBreakpointsRequest,
  isSetFunctionBreakpointsResponse,
  isStepInRequest,
  isStepOutRequest,
  isStoppedEvent,
} from "./guards";
import type { Status } from "./handlers";
import { BreakpointMap, type Location } from "./locations";

enum StepState {
  Idle = "idle",
  ClientStepInProgress = "client-step-in-progress",
  ReactorStepInProgress = "reactor-step-in-progress",
}

export class Reactor {
  private status: Status = {
    kind: "waiting-for-set-function-breakpoints",
  };

  // Breakpoint management
  private stepState = StepState.Idle;
  private breakpointMap = new BreakpointMap();
  // Last location where the process was stopped by a client action
  private lastClientLocation: Location | null = null;
  private waitingForFakeBreakpoint = false;

  constructor(
    private panel: vscode.WebviewPanel,
    private session: DebuggerSession,
    private gdbScriptPath: string,
  ) {}

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
    if (isSetBreakpointsRequest(message) && !this.waitingForFakeBreakpoint) {
      this.breakpointMap.setSourceBreakpoints(
        message.arguments.source,
        message.arguments.breakpoints ?? [],
      );
    }

    // The client requested a step, take note of it
    if (
      isNextRequest(message) ||
      isStepInRequest(message) ||
      isStepOutRequest(message)
    ) {
      this.stepState = StepState.ClientStepInProgress;
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

        if (!(await this.checkDebugInfo(stopLocation))) {
          return;
        }

        // If the user also has a breakpoint here, do not ignore it
        const hasUserBreakpoint =
          this.breakpointMap.hasUserBreakpoint(stopLocation);
        if (!hasUserBreakpoint) {
          ignoreMessage(message);
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
          await this.onThreadStopped(stopLocation);
        } else {
          await this.session.continue(threadId);
        }
      }
    } else if (this.status.kind === "initialized") {
      if (isStoppedEvent(message)) {
        const reason = message.body.reason;
        const stopLocation = getStopLocation(message);
        if (!(await this.checkDebugInfo(stopLocation))) {
          return;
        }
        // console.log(
        //   "STOPPED",
        //   reason,
        //   "STEP STATE",
        //   this.stepState,
        //   "SOURCE",
        //   `${stopLocation.source.path}:${stopLocation.line}`,
        // );
        // The program has stopped at a "fake" breakpoint created by us
        if (reason === "breakpoint" && this.waitingForFakeBreakpoint) {
          this.waitingForFakeBreakpoint = false;
          // Delete the fake breakpoint
          const breakpoints = this.breakpointMap.getSourceBreakpoints(
            stopLocation.source,
          );
          await this.session.setBreakpoints(stopLocation.source, breakpoints);
          this.stepState = StepState.Idle;
          this.lastClientLocation = stopLocation;
        } else if (reason === "exception") {
          // This should be an exception within a memory allocation function
          // Ignore the event in VSCode
          // This needs to be done before the first await!
          // So that it is synchronous w.r.t. VSCode event handling
          ignoreMessage(message);

          const [threadId, frameId] =
            await this.session.getCurrentThreadAndFrameId();

          const clientStepInProgress =
            this.stepState === StepState.ClientStepInProgress;
          this.stepState = StepState.ReactorStepInProgress;
          await this.handleMemoryAllocationBreakpoint(frameId);

          if (clientStepInProgress) {
            // In this case, we need to continue with the previously requested step
            // from the client. We do that by creating a temporary fake breakpoint
            // set to the next line after the last stopped client location.
            // Once that breakpoint is hit, we remove it.
            this.stepState = StepState.ClientStepInProgress;
            if (this.lastClientLocation === null) {
              // This should not happen
              await this.session.next(threadId);
            } else {
              const breakpoints = this.breakpointMap.getSourceBreakpoints(
                this.lastClientLocation.source,
              );
              const withFakeBreakpoint = [
                ...breakpoints,
                {
                  line: this.lastClientLocation.line + 1,
                },
              ];
              this.waitingForFakeBreakpoint = true;
              const source = this.lastClientLocation.source;
              await this.session.setBreakpoints(source, withFakeBreakpoint);
              await this.session.continue(threadId);
            }
          } else {
            this.stepState = StepState.Idle;
            await this.session.continue(threadId);
          }
        } else if (
          reason === "step" &&
          this.stepState === StepState.ReactorStepInProgress
        ) {
          ignoreMessage(message);
        } else if (
          reason === "step" ||
          reason === "breakpoint" ||
          reason === "pause"
        ) {
          await this.onThreadStopped(stopLocation);
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

      const [threadId, frameId] =
        await this.session.getCurrentThreadAndFrameId();
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

    // Set breakpoint for known (g)libc memory allocation functions
    const MEM_ALLOC_FNS = ["malloc", "calloc", "realloc", "free"];

    // We set the breakpoint manually using GDB, so that the breaks are
    // marked as exception, so that we can distinguish them from normal breakpoints.
    // Ideally, we should do this through breakpoint IDs, but the cppdbg adapter does not
    // seem to send them.
    for (const allocFn of MEM_ALLOC_FNS) {
      await this.session.evaluate(`break ${allocFn}`, frameId);
    }

    // We need to change the status BEFORE starting the asynchronous continue
    this.status = { kind: "initialized" };
  }

  private async handleMemoryAllocationBreakpoint(frameId: FrameId) {
    const result = await this.session.evaluate(
      "py print(gdb.selected_frame().name())",
    );
    const fnName = result.result.trimEnd();
    const args = await this.session.getCurrentFnArgs(frameId);

    const isAlloc =
      fnName.endsWith("malloc") ||
      fnName.endsWith("calloc") ||
      fnName.endsWith("realloc");

    if (isAlloc) {
      const address =
        await this.session.finishCurrentFnAndGetReturnValue(frameId);
      let size = Number.parseInt(args[0]);
      if (fnName.endsWith("malloc")) {
        console.assert(args.length === 1);
      } else if (fnName.endsWith("calloc")) {
        console.assert(args.length === 2);
        size = Number.parseInt(args[0]) * Number.parseInt(args[1]);
      } else if (fnName.endsWith("realloc")) {
        console.assert(args.length === 2);

        await this.sendMemvizEvent({
          kind: "mem-freed",
          address: args[0],
        });
        size = Number.parseInt(args[1]);
      }

      await this.sendMemvizEvent({
        kind: "mem-allocated",
        address,
        size,
      });
    } else if (fnName.endsWith("free")) {
      await this.sendMemvizEvent({
        kind: "mem-freed",
        address: args[0],
      });
    }
  }

  /// This method handles requests from the webview.
  /// It asks DAP for information and sends responses back to the webview.
  async handleWebviewMessage(message: MemvizToExtensionMsg) {
    if (message.kind === "get-stack-trace") {
      await this.performGetStackTraceRequest(message);
    } else if (message.kind === "get-variables") {
      await this.performGetPlacesRequest(message);
    } else if (message.kind === "read-memory") {
      await this.performReadMemoryRequest(message);
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
        kind: "get-variables",
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

  private async onThreadStopped(stopLocation: Location) {
    this.stepState = StepState.Idle;
    this.lastClientLocation = stopLocation;

    const response = await this.session.getThreads();
    const stackTrace = await this.session.getStackTrace(
      response.threads[0].id,
      true,
    );
    const stackAddressRange = await this.session.getStackAddressRange(
      stackTrace[0].id,
    );

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
    // console.log("Sending memviz event", msg);
    await this.panel.webview.postMessage(msg);
  }

  private async sendMemvizResponse(
    request: MemvizToExtensionRequest,
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
      console.log("Error while handing request", request, e);
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
function ignoreMessage(message: DebugProtocol.Event) {
  // console.log("Ignoring message", message);
  message.type = "invalid";
}

function getStopLocation(event: DebugProtocol.StoppedEvent): Location {
  return {
    source: (event.body as any).source as DebugProtocol.Source,
    line: (event.body as any).line,
  };
}
