import type { MemvizToExtensionMsg } from "memviz-ui";
import type {
  ExtensionToMemvizGDBResponse,
  GetPlacesReq,
  GetPlacesRes,
  ProcessStoppedEvent,
  TakeAllocEventsReq,
  TakeAllocEventsRes,
} from "memviz-ui/src/messages";
import { SessionType } from "process-def";
import type { GDBDebuggerSession } from "../../session/gdb";
import { WebviewMessageHandler } from "./webviewMessageHandler";

export class GDBWebviewMessageHandler extends WebviewMessageHandler<
  GDBDebuggerSession,
  ExtensionToMemvizGDBResponse
> {
  public getHandleCallback(
    message: MemvizToExtensionMsg,
    session: GDBDebuggerSession,
  ) {
    if (message.kind === "get-places") {
      return this.performGetPlacesRequest(message, session);
    }
    if (message.kind === "take-alloc-events") {
      return this.performTakeAllocEventsRequest(message, session);
    }
    return super.getHandleCallback(message, session);
  }

  public async getProcessStoppedMessage(
    session: GDBDebuggerSession,
  ): Promise<ProcessStoppedEvent> {
    const response = await session.getThreads();
    const stackTrace = await session.getStackTrace(
      response.threads[0].id,
      true,
    );
    const frameId = stackTrace[0].id;
    const stackAddressRange = await session.getStackAddressRange(frameId);

    return {
      kind: "process-stopped",
      sessionType: SessionType.GDB,
      state: {
        stackTrace: {
          frames: stackTrace,
        },
        stackAddressRange,
      },
    } as const;
  }

  private performGetPlacesRequest(
    message: GetPlacesReq,
    session: GDBDebuggerSession,
  ): () => Promise<Omit<GetPlacesRes, "requestId" | "resolverId">> {
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

  private performTakeAllocEventsRequest(
    message: TakeAllocEventsReq,
    session: GDBDebuggerSession,
  ): () => Promise<Omit<TakeAllocEventsRes, "requestId" | "resolverId">> {
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
