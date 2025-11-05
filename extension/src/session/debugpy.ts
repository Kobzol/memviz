import { type AddressStr, type FrameIndex, SessionType } from "process-def";
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
    frameIndex: FrameIndex,
  ): Promise<Variables> {
    return await this.pythonEvaluate<Variables>(
      `get_variables(${frameIndex}, __file__)`,
    );
  }

  async getCollectionElements(
    id: AddressStr,
    frameIndex: number,
    startIndex: number,
    elementCount: number,
  ): Promise<Value[]> {
    const result = await this.pythonEvaluate<Value[]>(
      `get_collection_elements("${id}", ${frameIndex}, __file__, ${startIndex}, ${elementCount})`,
    );
    return result;
  }

  async getDictEntries(
    id: AddressStr,
    frameIndex: number,
    startIndex: number,
    pairCount: number,
  ): Promise<KeyValuePair[]> {
    const result = await this.pythonEvaluate<KeyValuePair[]>(
      `get_dict_entries("${id}", ${frameIndex}, __file__, ${startIndex}, ${pairCount})`,
    );
    return result;
  }

  async getStringContents(
    id: AddressStr,
    frameIndex: number,
    startIndex: number,
    length: number,
  ): Promise<string> {
    const result = await this.pythonEvaluate<string>(
      `get_string_contents("${id}", ${frameIndex}, __file__, ${startIndex}, ${length})`,
    );
    return result;
  }

  async getObject(id: AddressStr, frameIndex: number): Promise<ObjectVal> {
    const result = await this.pythonEvaluate<ObjectVal>(
      `get_object("${id}", ${frameIndex}, __file__)`,
    );
    return result;
  }
}
