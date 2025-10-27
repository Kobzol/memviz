import type { MemvizToExtensionMsg } from "memviz-ui";
import type {
  ExtensionToMemvizDebugpyResponse,
  GetCollectionTypeElementsReq,
  GetCollectionTypeElementsRes,
  GetDictPairsReq,
  GetDictPairsRes,
  GetObjectReq,
  GetObjectRes,
  GetPythonVariablesRepresentationReq,
  GetPythonVariablesRepresentationRes,
  GetStringContentsReq,
  GetStringContentsRes,
  ProcessStoppedEvent,
} from "memviz-ui/src/messages";
import { SessionType } from "process-def";
import type { DebugpyDebuggerSession } from "../../session/debugpy";
import { WebviewMessageHandler } from "./webviewMessageHandler";

export class DebugpyWebviewMessageHandler extends WebviewMessageHandler<
  DebugpyDebuggerSession,
  ExtensionToMemvizDebugpyResponse
> {
  public getHandleCallback(
    message: MemvizToExtensionMsg,
    session: DebugpyDebuggerSession,
  ) {
    if (message.kind === "get-python-variables-representation") {
      return this.performGetVariablesRequest(message, session);
    }
    if (message.kind === "get-collection-type-elements") {
      return this.performGetCollectionTypeElementsRequest(message, session);
    }
    if (message.kind === "get-dict-pairs") {
      return this.performGetDictPairsRequest(message, session);
    }
    if (message.kind === "get-string-contents") {
      return this.performGetStringContentsRequest(message, session);
    }
    if (message.kind === "get-object") {
      return this.performGetObjectRequest(message, session);
    }
    return super.getHandleCallback(message, session);
  }

  public async getProcessStoppedMessage(
    session: DebugpyDebuggerSession,
  ): Promise<ProcessStoppedEvent> {
    const response = await session.getThreads();
    const stackTrace = await session.getStackTrace(
      response.threads[0].id,
      true,
    );

    return {
      kind: "process-stopped",
      sessionType: SessionType.Debugpy,
      state: {
        stackTrace: {
          frames: stackTrace,
        },
        stackAddressRange: null,
      },
    } as const;
  }

  private performGetVariablesRequest(
    message: GetPythonVariablesRepresentationReq,
    session: DebugpyDebuggerSession,
  ): () => Promise<
    Omit<GetPythonVariablesRepresentationRes, "requestId" | "resolverId">
  > {
    return async () => {
      const variables = await session.createVariablesRepresentation(
        message.frameIndex,
      );
      return {
        kind: "get-python-variables-representation",
        data: {
          variables,
        },
      };
    };
  }

  private performGetCollectionTypeElementsRequest(
    message: GetCollectionTypeElementsReq,
    session: DebugpyDebuggerSession,
  ): () => Promise<
    Omit<GetCollectionTypeElementsRes, "requestId" | "resolverId">
  > {
    return async () => {
      const elements = await session.getCollectionTypeElements(
        message.reference,
        message.frameIndex,
        message.startIndex,
        message.elementCount,
      );
      return {
        kind: "get-collection-type-elements",
        data: {
          elements,
        },
      };
    };
  }

  private performGetDictPairsRequest(
    message: GetDictPairsReq,
    session: DebugpyDebuggerSession,
  ): () => Promise<Omit<GetDictPairsRes, "requestId" | "resolverId">> {
    return async () => {
      const pairs = await session.getDictPairs(
        message.reference,
        message.frameIndex,
        message.startIndex,
        message.pairCount,
      );
      return {
        kind: "get-dict-pairs",
        data: {
          pairs,
        },
      };
    };
  }

  private performGetStringContentsRequest(
    message: GetStringContentsReq,
    session: DebugpyDebuggerSession,
  ): () => Promise<Omit<GetStringContentsRes, "requestId" | "resolverId">> {
    return async () => {
      const contents = await session.getStringContents(
        message.reference,
        message.frameIndex,
        message.startIndex,
        message.length,
      );
      return {
        kind: "get-string-contents",
        data: {
          contents,
        },
      };
    };
  }

  private performGetObjectRequest(
    message: GetObjectReq,
    session: DebugpyDebuggerSession,
  ): () => Promise<Omit<GetObjectRes, "requestId" | "resolverId">> {
    return async () => {
      const objectVal = await session.getObject(
        message.reference,
        message.frameIndex,
      );
      return {
        kind: "get-object",
        data: {
          object: objectVal,
        },
      };
    };
  }
}
