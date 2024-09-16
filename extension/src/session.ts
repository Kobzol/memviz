import type { DebugProtocol } from "@vscode/debugprotocol";
import {
  type FrameId,
  type Place,
  PlaceKind,
  type ThreadId,
} from "process-def";
import type { DebugSession } from "vscode";
import type { ExtractBody } from "./utils";

export class DebuggerSession {
  constructor(private session: DebugSession) {}

  async setBreakpoints(
    source: DebugProtocol.Source,
    breakpoints: DebugProtocol.SourceBreakpoint[],
  ): Promise<ExtractBody<DebugProtocol.SetBreakpointsResponse>> {
    const args: DebugProtocol.SetBreakpointsArguments = {
      source,
      breakpoints,
    };
    return await this.session.customRequest("setBreakpoints", args);
  }

  async setFunctionBreakpoints(
    breakpoints: DebugProtocol.FunctionBreakpoint[],
  ): Promise<ExtractBody<DebugProtocol.SetFunctionBreakpointsResponse>> {
    const args: DebugProtocol.SetFunctionBreakpointsArguments = {
      breakpoints,
    };
    return await this.session.customRequest("setFunctionBreakpoints", args);
  }

  // `py print(serialize_type(parse_type("int")))`
  async evaluate(
    expression: string,
    frameId?: FrameId,
  ): Promise<ExtractBody<DebugProtocol.EvaluateResponse>> {
    const args: DebugProtocol.EvaluateArguments = {
      expression: `-exec ${expression}`,
      frameId,
      context: "repl",
    };
    return await this.session.customRequest("evaluate", args);
  }

  async next(threadId: ThreadId) {
    const args: DebugProtocol.NextArguments = {
      threadId,
      granularity: "line",
    };
    return await this.session.customRequest("next", args);
  }

  async stepOut(threadId: ThreadId) {
    const args: DebugProtocol.StepOutArguments = {
      threadId,
      granularity: "line",
    };
    return await this.session.customRequest("stepOut", args);
  }

  async continue(threadId: ThreadId) {
    const args: DebugProtocol.ContinueArguments = {
      threadId,
    };
    return await this.session.customRequest("continue", args);
  }

  async goto(threadId: ThreadId, gotoTargetId: number) {
    const args: DebugProtocol.GotoArguments = {
      threadId,
      targetId: gotoTargetId,
    };
    return await this.session.customRequest("goto", args);
  }

  async getGotoTargets(
    source: DebugProtocol.Source,
    line: number,
  ): Promise<ExtractBody<DebugProtocol.GotoTargetsResponse>> {
    const args: DebugProtocol.GotoTargetsArguments = {
      source,
      line,
    };
    return await this.session.customRequest("gotoTargets", args);
  }

  async getThreads(): Promise<ExtractBody<DebugProtocol.ThreadsResponse>> {
    return await this.session.customRequest("threads");
  }

  async getCurrentThreadAndFrameId(): Promise<[ThreadId, FrameId]> {
    const threads = await this.getThreads();
    const threadId = threads.threads[0].id;
    const stackFrame = await this.getStackTrace(threadId);
    return [threadId, stackFrame.stackFrames[0].id];
  }

  async getCurrentFnArgs(frameId: FrameId): Promise<string[]> {
    const result = await this.evaluate("info args", frameId);
    const args = [];
    for (let arg of result.result.split("\n")) {
      arg = arg.trim();
      const argParts = arg.split("=");
      if (argParts.length === 2) {
        args.push(argParts[1].trim());
      }
    }
    return args;
  }

  async finishCurrentFnAndGetReturnValue(frameId: FrameId): Promise<string> {
    // Finish the current function
    await this.evaluate("finish", frameId);
    // Get last saved value
    const result = await this.evaluate(`printf "%p",$`);
    return result.result.trim();
  }

  async getStackTrace(
    threadId: ThreadId,
  ): Promise<ExtractBody<DebugProtocol.StackTraceResponse>> {
    const args: DebugProtocol.StackTraceArguments = {
      threadId,
    };
    return await this.session.customRequest("stackTrace", args);
  }

  async getScopes(
    frameId: FrameId,
  ): Promise<ExtractBody<DebugProtocol.ScopesResponse>> {
    const args: DebugProtocol.ScopesArguments = {
      frameId,
    };
    return await this.session.customRequest("scopes", args);
  }

  async getVariables(
    variablesReference: number,
  ): Promise<ExtractBody<DebugProtocol.VariablesResponse>> {
    const args: DebugProtocol.VariablesArguments = {
      variablesReference,
    };
    return await this.session.customRequest("variables", args);
  }

  async getPlaces(frameId: FrameId): Promise<Place[]> {
    const response = await this.getScopes(frameId);

    const places: Place[] = [];
    for (const scope of response.scopes) {
      let kind = PlaceKind.Variable;
      if (scope.presentationHint === "arguments") {
        kind = PlaceKind.Parameter;
      } else if (scope.presentationHint !== "locals") {
        continue;
      }

      const res = await this.getVariables(scope.variablesReference);

      for (const variable of res.variables) {
        // Get the address of the variable
        const result = await this.evaluate(
          `printf "%p",&${variable.evaluateName ?? variable.name}`,
          frameId,
        );
        const address = result.result.trim();
        places.push({
          kind,
          name: variable.name,
          address,
          type: variable.type ?? null,
          simpleValue: variable.value,
        });
      }
    }
    return places;
  }
}
