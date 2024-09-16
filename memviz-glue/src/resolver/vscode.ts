import type { WebviewApi } from "vscode-webview";
import type {
  ExtensionToMemvizResponse,
  GetStackTraceReq,
  GetStackTraceRes,
  GetVariablesReq,
  GetVariablesRes,
  MemvizToExtensionMsg,
  MemvizToExtensionReq,
  RequestId,
} from "../messages";
import type { FrameId, Place, StackTrace, ThreadId } from "process-def";
import type { ProcessResolver } from "./resolver";

type ExtractData<T extends { data: unknown }> = T["data"];

export class VsCodeResolver implements ProcessResolver {
  private requestId: RequestId = 0;
  private requestMap: Map<RequestId, (response: unknown) => void> = new Map();

  public constructor(private vscode: WebviewApi<unknown>) {}

  handleMessage(message: ExtensionToMemvizResponse) {
    console.log(`Received response for request ${message.requestId}`);
    const resolveFn = this.requestMap.get(message.requestId);
    if (resolveFn === undefined) {
      console.warn(
        `Received response for an unknown or already handled request ${message.requestId}`,
      );
      return;
    }
    resolveFn(message.data);
  }

  async getStackTrace(threadId: ThreadId): Promise<StackTrace> {
    const res = await this.sendRequest<GetStackTraceReq, GetStackTraceRes>({
      kind: "get-stack-trace",
      threadId,
    });
    return res.stackTrace;
  }

  async getVariables(frameId: FrameId): Promise<Place[]> {
    const res = await this.sendRequest<GetVariablesReq, GetVariablesRes>({
      kind: "get-variables",
      frameId,
    });
    return res.places;
  }

  private sendRequest<
    RequestType extends MemvizToExtensionReq,
    ResponseType extends { data: unknown },
  >(
    request: Omit<RequestType, "requestId">,
  ): Promise<ExtractData<ResponseType>> {
    const requestId = this.requestId;
    this.requestId++;

    this.sendMessage({ ...request, requestId } as RequestType);

    const promise = new Promise<ExtractData<ResponseType>>(
      (resolve, _reject) => {
        this.requestMap.set(requestId, resolve as (_data: unknown) => void);
      },
    );
    return promise;
  }

  private sendMessage(msg: MemvizToExtensionMsg) {
    console.log(
      `Sending request to extension (kind=${msg.kind}, id=${msg.requestId})`,
    );
    this.vscode.postMessage(msg);
  }
}
