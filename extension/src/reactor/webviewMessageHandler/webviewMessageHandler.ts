import type {
  ExtensionToMemvizResponse,
  MemvizToExtensionMsg,
} from "memviz-ui";
import type { ProcessStoppedEvent } from "memviz-ui/src/messages";
import type { DebuggerSession } from "../../session/session";

export interface WebviewMessageHandler<T extends DebuggerSession> {
  getHandleCallback(
    message: MemvizToExtensionMsg,
    session: T,
  ):
    | (() => Promise<
        Omit<ExtensionToMemvizResponse, "requestId" | "resolverId">
      >)
    | null;
  getProcessStoppedMessage(session: T): Promise<ProcessStoppedEvent>;
}
