import { type FrameId, type FrameIndex, SessionType } from "process-def";
import type {
  KeyValuePair,
  ObjectVal,
  Value,
  Variables,
} from "process-def/debugpy";
import type { DebugSession } from "vscode";
import type { Location } from "../reactor/locations";
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

  async configureEvaluator(
    frameId: FrameId,
    stopLocation: Location,
  ): Promise<void> {
    await this.pythonEvaluate(
      `configure(r'${stopLocation.source?.path}')`,
      frameId,
    );
  }

  async createVariablesRepresentation(
    frameIndex: FrameIndex,
  ): Promise<Variables> {
    return await this.pythonEvaluate<Variables>(`get_variables(${frameIndex})`);
  }

  async getCollectionTypeElements(
    reference: string,
    frameIndex: number,
    startIndex: number,
    elementCount: number,
  ): Promise<Value[]> {
    const result = await this.pythonEvaluate<Value[]>(
      `get_collection_type_elements('${reference}', ${frameIndex}, ${startIndex}, ${elementCount})`,
    );
    return result;
  }

  async getDictPairs(
    reference: string,
    frameIndex: number,
    startIndex: number,
    pairCount: number,
  ): Promise<KeyValuePair[]> {
    const result = await this.pythonEvaluate<KeyValuePair[]>(
      `get_dict_pairs(${reference}, ${frameIndex}, ${startIndex}, ${pairCount})`,
    );
    return result;
  }

  async getStringContents(
    reference: string,
    frameIndex: number,
    startIndex: number,
    length: number,
  ): Promise<string> {
    const result = await this.pythonEvaluate<string>(
      `get_string_contents(${reference}, ${frameIndex}, ${startIndex}, ${length})`,
    );
    return result;
  }

  async getObject(reference: string, frameIndex: number): Promise<ObjectVal> {
    const result = await this.pythonEvaluate<ObjectVal>(
      `get_object(${reference}, ${frameIndex})`,
    );
    return result;
  }
}
