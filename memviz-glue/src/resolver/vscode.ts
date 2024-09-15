import type { WebviewApi } from "vscode-webview";
import type {
  ExtensionToMemvizResponse,
  GetStackTraceRes,
  GetVariablesRes,
  MemvizToExtensionMsg,
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
    const [id, promise] = this.prepareRequest<GetStackTraceRes>();

    this.sendMessage({
      kind: "get-stack-trace",
      requestId: id,
      threadId,
    });
    const res = await promise;
    return res.stackTrace;
  }

  async getVariables(frameId: FrameId): Promise<Place[]> {
    const [id, promise] = this.prepareRequest<GetVariablesRes>();

    this.sendMessage({
      kind: "get-variables",
      requestId: id,
      frameId,
    });
    const res = await promise;
    return res.places;
  }

  private prepareRequest<ResponseType extends { data: unknown }>(): [
    RequestId,
    Promise<ExtractData<ResponseType>>,
  ] {
    const id = this.requestId;
    this.requestId++;
    const promise = new Promise<ExtractData<ResponseType>>(
      (resolve, _reject) => {
        this.requestMap.set(id, resolve as (_data: unknown) => void);
      },
    );
    return [id, promise];
  }

  private sendMessage(msg: MemvizToExtensionMsg) {
    console.log(
      `Sending request to extension (kind=${msg.kind}, id=${msg.requestId})`,
    );
    this.vscode.postMessage(msg);
  }
}
