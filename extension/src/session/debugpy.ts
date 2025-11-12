import {
  type AddressStr,
  type FrameId,
  type FrameIndex,
  SessionType,
} from "process-def";
import type {
  KeyValuePair,
  ResolvedObjectVal,
  Value,
  Variables,
} from "process-def/debugpy";
import type { DebugSession } from "vscode";
import { DebugpyWebviewMessageHandler } from "../reactor/webviewMessageHandler/debugpy";
import { DebugpyEvaluator } from "./evaluator/debugpy";
import type { ScriptPathProvider } from "./scriptPathProvider";
import { DebuggerSession } from "./session";

export class DebugpyDebuggerSession extends DebuggerSession<DebugpyEvaluator> {
  protected evaluator: DebugpyEvaluator;

  constructor(session: DebugSession, scriptPathProvider: ScriptPathProvider) {
    super(session);
    this.evaluator = new DebugpyEvaluator(
      session,
      scriptPathProvider.getInitScriptPath(SessionType.Debugpy),
    );
  }

  override createWebviewMessageHandler() {
    return new DebugpyWebviewMessageHandler();
  }

  async createVariablesRepresentation(
    frameId: FrameId,
    frameIndex: FrameIndex,
  ): Promise<Variables> {
    return await this.pythonEvaluate<Variables>(
      `get_variables(${frameIndex}, __file__)`,
      frameId,
    );
  }

  async getCollectionElements(
    frameId: FrameId,
    id: AddressStr,
    frameIndex: number,
    startIndex: number,
    elementCount: number,
  ): Promise<Value[]> {
    const result = await this.pythonEvaluate<Value[]>(
      `get_collection_elements("${id}", ${frameIndex}, __file__, ${startIndex}, ${elementCount})`,
      frameId,
    );
    return result;
  }

  async getDictEntries(
    frameId: FrameId,
    id: AddressStr,
    frameIndex: number,
    startIndex: number,
    pairCount: number,
  ): Promise<KeyValuePair[]> {
    const result = await this.pythonEvaluate<KeyValuePair[]>(
      `get_dict_entries("${id}", ${frameIndex}, __file__, ${startIndex}, ${pairCount})`,
      frameId,
    );
    return result;
  }

  async getStringContents(
    frameId: FrameId,
    id: AddressStr,
    frameIndex: number,
    startIndex: number,
    length: number,
  ): Promise<string> {
    const result = await this.pythonEvaluate<string>(
      `get_string_contents("${id}", ${frameIndex}, __file__, ${startIndex}, ${length})`,
      frameId,
    );
    return result;
  }

  async getObject(
    frameId: FrameId,
    id: AddressStr,
    frameIndex: number,
  ): Promise<ResolvedObjectVal> {
    const result = await this.pythonEvaluate<ResolvedObjectVal>(
      `get_object("${id}", ${frameIndex}, __file__)`,
      frameId,
    );
    return result;
  }
}
