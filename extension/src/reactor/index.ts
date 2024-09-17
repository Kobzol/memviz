import type * as vscode from "vscode";

import type { DebugProtocol } from "@vscode/debugprotocol";
import type {
  ExtensionToMemvizMsg,
  ExtensionToMemvizResponse,
  GetStackTraceReq,
  GetVariablesReq,
  MemvizToExtensionMsg,
} from "memviz-glue";
import type { FrameId } from "process-def";
import type { DebuggerSession } from "../session";
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
      if (isStoppedEvent(message)) {
        // TODO: this skips breakpoint set at the beginning of main set by a user
        ignoreMessage(message);

        const [_, frameId] = await this.session.getCurrentThreadAndFrameId();

        // TODO: check if we're using GDB
        // Load helper GDB Python script
        const loadResult = await this.session.evaluate(
          `source ${this.gdbScriptPath}`,
          frameId,
        );
        console.assert(loadResult.result.trim() === "");
        await this.handleMainBreakpointEvent();
      }
    } else if (this.status.kind === "initialized") {
      if (isStoppedEvent(message)) {
        const reason = message.body.reason;
        const stopLocation: Location = {
          source: (message.body as any).source as DebugProtocol.Source,
          line: (message.body as any).line,
        };
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
          this.stepState = StepState.Idle;
          this.lastClientLocation = stopLocation;

          await this.sendVisualizeStateEvent();
        }
      }
    }
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

  private async handleMainBreakpointEvent() {
    // The program has stopped at main
    // Perform all initialization actions, and then resume the program
    const [threadId, frameId] = await this.session.getCurrentThreadAndFrameId();

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
    await this.session.continue(threadId);
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
      this.performStackTraceRequest(message);
    } else if (message.kind === "get-variables") {
      this.performVariablesRequest(message);
    }
  }

  dispose() {
    this.panel.dispose();
  }

  private async performStackTraceRequest(message: GetStackTraceReq) {
    const frames = await this.session.getStackTrace(message.threadId);
    this.sendMemvizResponse({
      kind: "get-stack-trace",
      requestId: message.requestId,
      data: {
        stackTrace: {
          frames,
        },
      },
    });
  }

  private async performVariablesRequest(message: GetVariablesReq) {
    const places = await this.session.getPlaces(message.frameIndex);

    this.sendMemvizResponse({
      kind: "get-variables",
      requestId: message.requestId,
      data: {
        places,
      },
    });
  }

  private async sendVisualizeStateEvent() {
    const response = await this.session.getThreads();
    this.sendMemvizEvent({
      kind: "visualize-state",
      state: {
        threads: response.threads.map((t) => t.id),
      },
    });
  }

  private async sendMemvizEvent(msg: ExtensionToMemvizMsg) {
    // console.log("Sending memviz event", msg);
    await this.panel.webview.postMessage(msg);
  }

  private async sendMemvizResponse(response: ExtensionToMemvizResponse) {
    await this.panel.webview.postMessage(response);
  }
}

// Mangles the event so that the client (VSCode) does not observe it
function ignoreMessage(message: DebugProtocol.Event) {
  // console.log("Ignoring message", message);
  message.type = "invalid";
}
