import type { DebugProtocol } from "@vscode/debugprotocol";
import type { ExtensionToMemvizResponse } from "memviz-ui";
import {
  type FrameId,
  SessionType,
  type StackFrame,
  type ThreadId,
} from "process-def";
import type { DebugSession } from "vscode";
import type { WebviewMessageHandler } from "../reactor/webviewMessageHandler/webviewMessageHandler";
import type { ExtractBody } from "../utils";
import type { Evaluator } from "./evaluator/evaluator";

export abstract class DebuggerSession<TEvaluator extends Evaluator> {
  protected abstract evaluator: TEvaluator;

  constructor(protected session: DebugSession) {}

  public abstract createWebviewMessageHandler(): WebviewMessageHandler<
    this,
    ExtensionToMemvizResponse
  >;

  public getSessionType(): SessionType {
    switch (this.session.configuration.type) {
      case "cppdbg":
        return SessionType.GDB;
      case "debugpy":
        return SessionType.Debugpy;
      default:
        throw new Error(
          `Unsupported session type: ${this.session.configuration.type}`,
        );
    }
  }

  public initEvaluator(frameId: FrameId) {
    return this.evaluator.init(frameId);
  }

  async setBreakpoints(
    source: DebugProtocol.Source,
    breakpoints: DebugProtocol.SourceBreakpoint[],
  ): Promise<ExtractBody<DebugProtocol.SetBreakpointsResponse>> {
    const args: DebugProtocol.SetBreakpointsArguments = {
      source,
      breakpoints,
    };
    return await this.evaluator.customRequest("setBreakpoints", args);
  }

  async setFunctionBreakpoints(
    breakpoints: DebugProtocol.FunctionBreakpoint[],
  ): Promise<ExtractBody<DebugProtocol.SetFunctionBreakpointsResponse>> {
    const args: DebugProtocol.SetFunctionBreakpointsArguments = {
      breakpoints,
    };
    return await this.evaluator.customRequest("setFunctionBreakpoints", args);
  }

  async readMemory(
    address: string,
    size: number,
  ): Promise<ExtractBody<Required<DebugProtocol.ReadMemoryResponse>>> {
    const args: DebugProtocol.ReadMemoryArguments = {
      memoryReference: address,
      count: size,
    };
    return await this.evaluator.customRequest("readMemory", args);
  }

  async next(threadId: ThreadId) {
    const args: DebugProtocol.NextArguments = {
      threadId,
      granularity: "line",
    };
    return await this.evaluator.customRequest("next", args);
  }

  async stepOut(threadId: ThreadId) {
    const args: DebugProtocol.StepOutArguments = {
      threadId,
      granularity: "line",
    };
    return await this.evaluator.customRequest("stepOut", args);
  }

  async continue(threadId: ThreadId) {
    const args: DebugProtocol.ContinueArguments = {
      threadId,
    };
    return await this.evaluator.customRequest("continue", args);
  }

  async goto(threadId: ThreadId, gotoTargetId: number) {
    const args: DebugProtocol.GotoArguments = {
      threadId,
      targetId: gotoTargetId,
    };
    return await this.evaluator.customRequest("goto", args);
  }

  async getGotoTargets(
    source: DebugProtocol.Source,
    line: number,
  ): Promise<ExtractBody<DebugProtocol.GotoTargetsResponse>> {
    const args: DebugProtocol.GotoTargetsArguments = {
      source,
      line,
    };
    return await this.evaluator.customRequest("gotoTargets", args);
  }

  async getThreads(): Promise<ExtractBody<DebugProtocol.ThreadsResponse>> {
    return await this.evaluator.customRequest("threads");
  }

  async getCurrentThreadAndFrameId(): Promise<[ThreadId, FrameId]> {
    const threads = await this.getThreads();
    const threadId = threads.threads[0].id;
    const stackFrame = await this.getStackTrace(threadId);
    return [threadId, stackFrame[0].id];
  }

  async getStackTrace(
    threadId: ThreadId,
    values = false,
  ): Promise<StackFrame[]> {
    const args: DebugProtocol.StackTraceArguments = {
      threadId,
      format: {
        parameters: true,
        parameterNames: true,
        parameterTypes: true,
        parameterValues: values,
      },
    };
    const response: ExtractBody<DebugProtocol.StackTraceResponse> =
      await this.evaluator.customRequest("stackTrace", args);
    return response.stackFrames.map((frame, index) => ({
      id: frame.id,
      index,
      name: frame.name,
      line: frame.line,
      file: frame.source?.path ?? null,
    }));
  }

  async getScopes(
    frameId: FrameId,
  ): Promise<ExtractBody<DebugProtocol.ScopesResponse>> {
    const args: DebugProtocol.ScopesArguments = {
      frameId,
    };
    return await this.evaluator.customRequest("scopes", args);
  }

  async getVariables(
    variablesReference: number,
  ): Promise<ExtractBody<DebugProtocol.VariablesResponse>> {
    const args: DebugProtocol.VariablesArguments = {
      variablesReference,
    };
    return await this.evaluator.customRequest("variables", args);
  }

  protected async pythonEvaluate<T>(
    command: string,
    frameId?: FrameId,
  ): Promise<T> {
    const start = performance.now();
    const evaluatorResult = await this.evaluator.evaluate(command, frameId);
    const duration = performance.now() - start;
    // console.debug(
    // `Py command ${command} took ${duration.toFixed(2)}ms, response size: ${gdbResult.result.length}`,
    // );

    let pyResult: PyResult<T>;
    try {
      pyResult = JSON.parse(evaluatorResult.result);
    } catch (err) {
      throw new Error(
        `Python command ${command} returned non-JSON response:\n${evaluatorResult.result.trim()}`,
      );
    }
    if (!pyResult.ok) {
      throw new Error(`Python command ${command} failed:\n${pyResult.error}`);
    }
    return pyResult.value as T;
  }
}

interface PyResult<T> {
  ok: boolean;
  value: T | null;
  error: string | null;
}
