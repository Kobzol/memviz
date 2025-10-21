import type { MemvizToExtensionMsg } from "memviz-ui";
import type { DebugpyProcessStoppedEvent } from "memviz-ui/src/messages";
import type { DebugpyDebuggerSession } from "../../session/debugpy";
import type { WebviewMessageHandler } from "./webviewMessageHandler";

export class DebugpyWebviewMessageHandler
  implements WebviewMessageHandler<DebugpyDebuggerSession>
{
  public getHandleCallback(
    message: MemvizToExtensionMsg,
    session: DebugpyDebuggerSession,
  ) {
    return null;
  }

  public async getProcessStoppedMessage(
    session: DebugpyDebuggerSession,
  ): Promise<DebugpyProcessStoppedEvent> {
    return {
      kind: "process-stopped",
      type: "debugpy",
    } as const;
  }
}
