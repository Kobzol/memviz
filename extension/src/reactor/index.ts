import type * as vscode from "vscode";

import type { DebugProtocol } from "@vscode/debugprotocol";
import type {
  ExtensionToMemvizMsg,
  ExtensionToMemvizResponse,
  GetStackTraceReq,
  GetVariablesReq,
  MemvizToExtensionMsg,
} from "memviz-glue";
import type { DebuggerSession } from "../session";
import {
  isRequest,
  isSetFunctionBreakpointsRequest,
  isSetFunctionBreakpointsResponse,
  isStoppedEvent,
} from "./guards";
import type { FrameId } from "process-def";
import type { Status } from "./handlers";

enum StepState {
  Idle = "idle",
  ClientStepInProgress = "client-step-in-progress",
  ReactorStepInProgress = "reactor-step-in-progress",
}

export class Reactor {
  private status: Status = {
    kind: "waiting-for-set-function-breakpoints",
  };
  private stepState = StepState.Idle;
  private counter = 0;

  constructor(
    private panel: vscode.WebviewPanel,
    private session: DebuggerSession,
  ) {}

  dispose() {
    this.panel.dispose();
  }

  async handleMessageFromClient(message: DebugProtocol.ProtocolMessage) {
    // The client sends setFunctionBreakpoints at the very beginning of the debug session.
    // Add main to the list, so that we can perform some basic initialization at the start
    // of the debugged program.
    if (isSetFunctionBreakpointsRequest(message)) {
      message.arguments.breakpoints.push({
        name: "main",
      });
    }
    if (isRequest(message)) {
      const command = message.command;
      if (command === "next" || command === "stepIn" || command === "stepOut") {
        console.log("CLIENT PERFORMING STEP");
        this.stepState = StepState.ClientStepInProgress;
      }
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
        await this.handleMainBreakpointEvent();
      }
    } else if (this.status.kind === "initialized") {
      if (isStoppedEvent(message)) {
        const reason = message.body.reason;
        console.log(
          "STOPPED",
          reason,
          "STEP STATE",
          this.stepState,
          "SOURCE",
          `${message.body.source.path}:${message.body.line}`,
        );
        // This should be an exception within a memory allocation function
        if (reason === "exception") {
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

          // TODO: handle nested malloc calls. How to continue to end up back
          // when the user was?
          if (clientStepInProgress) {
            console.log("RESETTING TO CLIENT STEP");
            this.stepState = StepState.ClientStepInProgress;
            await this.session.next(threadId);
          } else {
            console.log("RESETTING TO CLIENT IDLE, CONTINUING");
            this.stepState = StepState.Idle;
            await this.session.continue(threadId);
          }
        } else if (reason === "step") {
          if (this.stepState === StepState.ReactorStepInProgress) {
            console.log("FINISHED CUSTOM STEP, IGNORING");
            ignoreMessage(message);
          } else if (this.stepState === StepState.ClientStepInProgress) {
            console.log("FINISHED CLIENT STEP, RESETTING TO IDLE");
            this.stepState = StepState.Idle;
          }
        } else if (
          reason === "step" ||
          reason === "breakpoint" ||
          reason === "pause"
        ) {
          // await this.sendVisualizeStateEvent();
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
    const breakpoint = breakpoints[breakpoints.length - 1];
    this.status = {
      kind: "waiting-for-main-breakpoint",
      mainBreakpointId: breakpoint.id ?? null,
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
      await this.session.evaluate(`-exec break ${allocFn}`, frameId);
    }

    // We need to change the status BEFORE starting the asynchronous continue
    this.status = {
      kind: "initialized",
    };
    await this.session.continue(threadId);
  }

  private async handleMemoryAllocationBreakpoint(frameId: FrameId) {
    const result = await this.session.evaluate(
      "-exec py print(gdb.selected_frame().name())",
    );
    const fnName = result.result.trimEnd();
    const args = await this.session.getCurrentFnArgs(frameId);

    const isAlloc =
      fnName.endsWith("malloc") ||
      fnName.endsWith("calloc") ||
      fnName.endsWith("realloc");

    if (isAlloc) {
      const address = await this.session.finishCurrentFnAndGetReturnValue();
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

  private async performStackTraceRequest(message: GetStackTraceReq) {
    const response = await this.session.getStackTrace(message.threadId);
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

  private async performVariablesRequest(message: GetVariablesReq) {
    const places = await this.session.getPlaces(message.frameId);
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

  private sendMemvizEvent(msg: ExtensionToMemvizMsg) {
    console.log("Sending memviz event", msg);
    this.panel.webview.postMessage(msg);
  }

  private sendMemvizResponse(response: ExtensionToMemvizResponse) {
    this.panel.webview.postMessage(response);
  }
}

// Mangles the event so that the client (VSCode) does not observe it
function ignoreMessage(message: DebugProtocol.Event) {
  // console.log("Ignoring message", message);
  message.type = "invalid";
}
