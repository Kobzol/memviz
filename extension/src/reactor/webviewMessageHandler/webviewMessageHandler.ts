import type {
  ExtensionToMemvizResponse,
  MemvizToExtensionMsg,
} from "memviz-ui";
import type {
  ExtensionToMemvizCommonResponse,
  GetStackTraceReq,
  GetStackTraceRes,
  ProcessStoppedEvent,
} from "memviz-ui/src/messages";
import type { Evaluator } from "../../session/evaluator/evaluator";
import type { DebuggerSession } from "../../session/session";

export abstract class WebviewMessageHandler<
  TSession extends DebuggerSession<Evaluator>,
  TResponse extends ExtensionToMemvizResponse = ExtensionToMemvizCommonResponse,
> {
  public getHandleCallback(
    message: MemvizToExtensionMsg,
    session: TSession,
  ):
    | (() => Promise<
        Omit<
          ExtensionToMemvizCommonResponse | TResponse,
          "requestId" | "resolverId"
        >
      >)
    | null {
    if (message.kind === "get-stack-trace") {
      return this.performGetStackTraceRequest(message, session);
    }
    return null;
  }

  private performGetStackTraceRequest(
    message: GetStackTraceReq,
    session: DebuggerSession<Evaluator>,
  ): () => Promise<Omit<GetStackTraceRes, "requestId" | "resolverId">> {
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

  abstract getProcessStoppedMessage(
    session: TSession,
  ): Promise<ProcessStoppedEvent>;
}
