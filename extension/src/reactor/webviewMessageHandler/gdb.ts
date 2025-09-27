import type { MemvizToExtensionMsg } from "memviz-ui";
import type {
  ExtensionToMemvizResponse,
  GDBProcessStoppedEvent,
  GetPlacesReq,
  GetStackTraceReq,
  ReadMemoryReq,
  TakeAllocEventsReq,
} from "memviz-ui/src/messages";
import type { GDBDebuggerSession } from "../../session/session";
import { decodeBase64 } from "../../utils";
import type { WebviewMessageHandler } from "./webviewMessageHandler";

export class GDBWebviewMessageHandler
  implements WebviewMessageHandler<GDBDebuggerSession>
{
  public getHandleCallback(
    message: MemvizToExtensionMsg,
    session: GDBDebuggerSession,
  ) {
    if (message.kind === "get-stack-trace") {
      return this.performGetStackTraceRequest(message, session);
    }
    if (message.kind === "get-places") {
      return this.performGetPlacesRequest(message, session);
    }
    if (message.kind === "read-memory") {
      return this.performReadMemoryRequest(message, session);
    }
    if (message.kind === "take-alloc-events") {
      return this.performTakeAllocEventsRequest(message, session);
    }
    return null;
  }

  public async getProcessStoppedMessage(
    session: GDBDebuggerSession,
  ): Promise<GDBProcessStoppedEvent> {
    const response = await session.getThreads();
    const stackTrace = await session.getStackTrace(
      response.threads[0].id,
      true,
    );
    const frameId = stackTrace[0].id;
    const stackAddressRange = await session.getStackAddressRange(frameId);

    return {
      kind: "process-stopped",
      type: "gdb",
      state: {
        stackTrace: {
          frames: stackTrace,
        },
        stackAddressRange,
      },
    } as const;
  }

  private performGetStackTraceRequest(
    message: GetStackTraceReq,
    session: GDBDebuggerSession,
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

  private performGetPlacesRequest(
    message: GetPlacesReq,
    session: GDBDebuggerSession,
  ): () => Promise<
    Omit<ExtensionToMemvizResponse, "requestId" | "resolverId">
  > {
    return async () => {
      const places = await session.getPlaces(message.frameIndex);
      return {
        kind: "get-places",
        data: {
          places,
        },
      };
    };
  }

  private performReadMemoryRequest(
    message: ReadMemoryReq,
    session: GDBDebuggerSession,
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

  private performTakeAllocEventsRequest(
    message: TakeAllocEventsReq,
    session: GDBDebuggerSession,
  ): () => Promise<
    Omit<ExtensionToMemvizResponse, "requestId" | "resolverId">
  > {
    return async () => {
      const [_, frameId] = await session.getCurrentThreadAndFrameId();
      const events = await session.takeAllocEvents(frameId);
      return {
        kind: "take-alloc-events",
        data: {
          events,
        },
      };
    };
  }
}
