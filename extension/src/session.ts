import type { DebugProtocol } from "@vscode/debugprotocol";
import {
  type Type,
  type FrameId,
  type Place,
  type StackFrame,
  type ThreadId,
  PlaceKind,
  type AddressRange,
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

  async evaluate(
    expression: string,
    frameId?: FrameId,
  ): Promise<ExtractBody<DebugProtocol.EvaluateResponse>> {
    // console.log(`Evaluating ${expression}`);
    const args: DebugProtocol.EvaluateArguments = {
      expression: `-exec ${expression}`,
      frameId,
      context: "repl",
    };
    return await this.session.customRequest("evaluate", args);
  }

  async getStackAddressRange(frameId: FrameId): Promise<AddressRange | null> {
    const result = await this.pythonEvaluate<string[] | null>(
      "get_stack_address_range()",
      frameId,
    );
    if (result !== null) {
      const [start, end] = result;
      return {
        start,
        end,
      };
    }
    return null;
  }

  async readMemory(address: string, size: number) {
    const args: DebugProtocol.ReadMemoryArguments = {
      memoryReference: address,
      count: size,
    };
    return await this.session.customRequest("readMemory", args);
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
    return [threadId, stackFrame[0].id];
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

  async getStackTrace(threadId: ThreadId): Promise<StackFrame[]> {
    const args: DebugProtocol.StackTraceArguments = {
      threadId,
    };
    const response: ExtractBody<DebugProtocol.StackTraceResponse> =
      await this.session.customRequest("stackTrace", args);
    return response.stackFrames.map((frame, index) => ({
      id: frame.id,
      index,
      name: frame.name,
    }));
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

  async getPlaces(frameIndex: number): Promise<Place[]> {
    const placeResponse = await this.pythonEvaluate<PlaceList>(
      `get_frame_places(${frameIndex})`,
    );
    return deserializePlaces(placeResponse);
  }

  private async pythonEvaluate<T>(
    command: string,
    frameId?: FrameId,
  ): Promise<T> {
    const start = performance.now();
    const gdbResult = await this.evaluate(
      `py print(try_run(lambda: ${command}))`,
      frameId,
    );
    const duration = performance.now() - start;
    console.debug(
      `Py command ${command} took ${duration.toFixed(2)}ms, response size: ${gdbResult.result.length}`,
    );

    let pyResult: PyResult<T>;
    try {
      pyResult = JSON.parse(gdbResult.result);
    } catch (err) {
      throw new Error(
        `Python command ${command} returned non-JSON response:\n${gdbResult.result.trim()}`,
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

type PlaceWithInternedType = {
  // Name
  n: string;
  // Address
  a: string | null;
  // Interned type
  t: number;
  // Kind
  k: string;
  // Initialized
  i: boolean;
};

interface PlaceList {
  places: PlaceWithInternedType[];
  types: Type[];
}

const PLACE_KIND_MAP: { [key: string]: PlaceKind } = {
  p: PlaceKind.Parameter,
  v: PlaceKind.Variable,
  s: PlaceKind.ShadowedVariable,
  g: PlaceKind.GlobalVariable,
};

function deserializePlaces(placeList: PlaceList): Place[] {
  // Unintern types
  const types = placeList.types;
  for (const type of types) {
    uninternType(type, types);
  }
  // Unintern and deserialize types
  const places: Place[] = [];
  for (const place of placeList.places) {
    places.push({
      kind: PLACE_KIND_MAP[place.k],
      name: place.n,
      address: place.a,
      type: types[place.t],
      initialized: place.i,
    });
  }
  return places;
}

function uninternType(type: Type, types: Type[]) {
  if (type.kind === "ptr") {
    if (Number.isInteger(type.target)) {
      type.target = types[type.target as unknown as number];
      uninternType(type.target, types);
    }
  } else if (type.kind === "struct") {
    for (const field of type.fields) {
      if (Number.isInteger(field.type)) {
        field.type = types[field.type as unknown as number];
        uninternType(field.type, types);
      }
    }
  } else if (type.kind === "array") {
    if (Number.isInteger(type.type)) {
      type.type = types[type.type as unknown as number];
      uninternType(type.type, types);
    }
  }
}
