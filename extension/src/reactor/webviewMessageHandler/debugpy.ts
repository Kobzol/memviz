import type { MemvizToExtensionMsg } from "memviz-ui";
import type { DebugpyDebuggerSession } from "../../session/session";
import type { WebviewMessageHandler } from "./webviewMessageHandler";
import type {
  DebugpyProcessStoppedEvent,
  ExtensionToMemvizResponse,
  GetPlacesReq,
} from "memviz-ui/dist/messages";

export class DebugpyWebviewMessageHandler
  implements WebviewMessageHandler<DebugpyDebuggerSession>
{
  public getHandleCallback(
    message: MemvizToExtensionMsg,
    session: DebugpyDebuggerSession,
  ) {
    if (message.kind === "get-places") {
      return this.performGetPlacesRequest(message, session);
    }
    return null;
  }
  private async fetchVariables(
    variablesReference: number,
    session: DebugpyDebuggerSession,
  ): Promise<any[]> {
    const { variables } = await session.getVariables(variablesReference);

    return Promise.all(
      variables.map(async (v) => {
        const children =
          v.variablesReference !== 0 &&
          v.name !== "special variables" &&
          v.name !== "function variables"
            ? await this.fetchVariables(v.variablesReference, session)
            : [];
        return { ...v, children };
      }),
    );
  }
  public async getProcessStoppedMessage(
    session: DebugpyDebuggerSession,
  ): Promise<DebugpyProcessStoppedEvent> {
    const response = await session.getThreads();
    const stackTrace = await session.getStackTrace(
      response.threads[0].id,
      true,
    );

    const frameId = stackTrace[0].id;
    const scopes = await session.getScopes(frameId);
    const variables = await Promise.all(
      scopes.scopes.map(async (scope) => ({
        scope,
        variables: await this.fetchVariables(scope.variablesReference, session),
      })),
    );
    console.log("variables", variables);

    return {
      kind: "process-stopped",
      type: "debugpy",
    } as const;
  }
  private performGetPlacesRequest(
    message: GetPlacesReq,
    session: DebugpyDebuggerSession,
  ): () => Promise<
    Omit<ExtensionToMemvizResponse, "requestId" | "resolverId">
  > {
    return async () => {
      const places = await session.getPlaces(message.frameIndex);
      console.log(`places: ${places}`);
      return {
        kind: "get-places",
        data: {
          places,
        },
      };
    };
  }
}
