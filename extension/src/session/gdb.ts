import type { DebugProtocol } from "@vscode/debugprotocol";
import type { InternedPlaceList, MemoryAllocEvent } from "memviz-ui";
import {
  type AddressRange,
  type FrameId,
  type FrameIndex,
  SessionType,
} from "process-def";
import type { DebugSession } from "vscode";
import type { Settings } from "../menu/settings";
import { isSetFunctionBreakpointsRequest } from "../reactor/guards";
import { GDBWebviewMessageHandler } from "../reactor/webviewMessageHandler/gdb";
import type { ExtractBody } from "../utils";
import { GDBEvaluator } from "./evaluator/gdb";
import type { ScriptPathProvider } from "./scriptPathProvider";
import { DebuggerSession } from "./session";

export class GDBDebuggerSession extends DebuggerSession<GDBEvaluator> {
  protected evaluator: GDBEvaluator;

  constructor(session: DebugSession, scriptPathProvider: ScriptPathProvider) {
    super(session);
    this.evaluator = new GDBEvaluator(
      session,
      scriptPathProvider.getInitScriptPath(SessionType.GDB),
    );
  }

  override createWebviewMessageHandler() {
    return new GDBWebviewMessageHandler();
  }

  override applyDebugAdapterMessageChanges(
    message: DebugProtocol.ProtocolMessage,
  ): void {
    // The client sends setFunctionBreakpoints at the very beginning of the debug session.
    // Add main to the list, so that we can perform some basic initialization at the start
    // of the debugged program.
    if (isSetFunctionBreakpointsRequest(message)) {
      message.arguments.breakpoints.push({
        name: "main",
      });
    }
  }

  override async handleInitialBreakpointEvent(
    frameId: FrameId,
    settings: Settings,
  ) {
    // The program has stopped at main
    if (settings.trackDynamicAllocations) {
      await this.initDynAllocTracking(frameId);
    }
  }

  override handleSetFunctionBreakpointsDebugAdapterResponse(
    message: DebugProtocol.SetFunctionBreakpointsResponse,
  ): void {
    const breakpoints = message.body.breakpoints;
    console.assert(breakpoints.length > 0);
  }

  private async initDynAllocTracking(frameId: FrameId): Promise<void> {
    await this.pythonEvaluate("configure_alloc_tracking()", frameId);
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

  async takeAllocEvents(frameId: FrameId): Promise<MemoryAllocEvent[]> {
    const records = await this.pythonEvaluate<FunctionCallRecord[]>(
      "take_alloc_records()",
      frameId,
    );
    const events: MemoryAllocEvent[] = [];
    for (const record of records) {
      if (record.name === "free") {
        events.push({
          kind: "mem-freed",
          address: record.args[0] as string,
        });
      } else if (record.name === "malloc") {
        events.push({
          kind: "mem-allocated",
          size: Number(record.args[0]),
          address: record.return_value as string,
        });
      } else if (record.name === "realloc") {
        events.push({
          kind: "mem-freed",
          address: record.args[0] as string,
        });
        events.push({
          kind: "mem-allocated",
          size: Number(record.args[1]),
          address: record.return_value as string,
        });
      } else if (record.name === "calloc") {
        events.push({
          kind: "mem-allocated",
          size: Number(record.args[0]) * Number(record.args[1]),
          address: record.return_value as string,
        });
      } else {
        throw new Error(
          `Unknown allocation record for function ${record.name}`,
        );
      }
    }
    return events;
  }

  async getCurrentFnArgs(frameId: FrameId): Promise<string[]> {
    const result = await this.evaluator.evaluate("info args", frameId);
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
    await this.evaluator.evaluate("finish", frameId);
    // Get last saved value
    const result = await this.evaluator.evaluate(`printf "%p",$`);
    return result.result.trim();
  }

  async getPlaces(frameIndex: FrameIndex): Promise<InternedPlaceList> {
    const placeResponse = await this.pythonEvaluate<InternedPlaceList>(
      `get_frame_places(${frameIndex})`,
      frameIndex,
    );
    return placeResponse;
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
}

interface FunctionCallRecord {
  name: string;
  args: unknown[];
  return_value: unknown | null;
}
