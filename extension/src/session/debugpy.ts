import type { FrameId, FrameIndex, PythonVariables } from "process-def";
import type { DebugSession } from "vscode";
import type { Location } from "../reactor/locations";
import { DebugpyWebviewMessageHandler } from "../reactor/webviewMessageHandler/debugpy";
import { DebugpyEvaluator } from "./evaluator/debugpy";
import type { ScriptPathProvider } from "./scriptPathProvider";
import { DebuggerSession } from "./session";
import { SessionType } from "./sessionType";

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

  async createVariableRepresentation(
    frameIndex: FrameIndex,
  ): Promise<PythonVariables> {
    return await this.pythonEvaluate<PythonVariables>(
      `get_variables(${frameIndex})`,
    );
  }
}
