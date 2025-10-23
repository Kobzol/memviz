import type {
  ExtensionToMemvizResponse,
  MemvizToExtensionMsg,
} from "memviz-ui";
import type {
  GetStackTraceReq,
  ProcessStoppedEvent,
  ReadMemoryReq,
} from "memviz-ui/src/messages";
import type { Evaluator } from "../../session/evaluator/evaluator";
import type { DebuggerSession } from "../../session/session";
import { decodeBase64 } from "../../utils";

export abstract class WebviewMessageHandler<
  T extends DebuggerSession<Evaluator>,
> {
  getHandleCallback(
    message: MemvizToExtensionMsg,
    session: T,
  ):
    | (() => Promise<
        Omit<ExtensionToMemvizResponse, "requestId" | "resolverId">
      >)
    | null {
    if (message.kind === "get-stack-trace") {
      return this.performGetStackTraceRequest(message, session);
    }
    if (message.kind === "read-memory") {
      return this.performReadMemoryRequest(message, session);
    }
    return null;
  }

  private performGetStackTraceRequest(
    message: GetStackTraceReq,
    session: DebuggerSession<Evaluator>,
  ): () => Promise<
    Omit<ExtensionToMemvizResponse, "requestId" | "resolverId">
  > {
    return async () => {
      const frames = await session.getStackTrace(message.threadId);
      return {
        kind: "get-stack-trace",
        data: {
          stackTrace: {
            frames,
          },
        },
      };
    };
  }

  private performReadMemoryRequest(
    message: ReadMemoryReq,
    session: DebuggerSession<Evaluator>,
  ): () => Promise<
    Omit<ExtensionToMemvizResponse, "requestId" | "resolverId">
  > {
    return async () => {
      const result = await session.readMemory(message.address, message.size);
      const data = await decodeBase64(result.data ?? "");
      return {
        kind: "read-memory",
        data: {
          data,
        },
      };
    };
  }

  abstract getProcessStoppedMessage(session: T): Promise<ProcessStoppedEvent>;
}
