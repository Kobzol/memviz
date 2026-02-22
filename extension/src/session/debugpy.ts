import {
  type AddressStr,
  type FrameId,
  type FrameIndex,
  SessionType,
} from "process-def";
import type {
  KeyValuePair,
  ObjectVal,
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

  async getFlatCollectionElements(
    frameId: FrameId,
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<Value[]> {
    const result = await this.pythonEvaluate<Value[]>(
      `get_flat_collection_elements("${id}", ${startIndex}, ${count})`,
      frameId,
    );
    return result;
  }

  async getDictEntries(
    frameId: FrameId,
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<KeyValuePair[]> {
    const result = await this.pythonEvaluate<KeyValuePair[]>(
      `get_dict_entries("${id}", ${startIndex}, ${count})`,
      frameId,
    );
    return result;
  }

  async getStringContents(
    frameId: FrameId,
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<string> {
    const result = await this.pythonEvaluate<string>(
      `get_string_contents("${id}", ${startIndex}, ${count})`,
      frameId,
    );
    return result;
  }

  async getObject(frameId: FrameId, id: AddressStr): Promise<ObjectVal> {
    const result = await this.pythonEvaluate<ObjectVal>(
      `get_object("${id}")`,
      frameId,
    );
    return result;
  }

  async handleStoppedEvent(): Promise<void> {
    await this.pythonEvaluate<void>("clear_id_map()");
  }
}
