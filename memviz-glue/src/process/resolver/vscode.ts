import type { WebviewApi } from "vscode-webview";
import type {
  ExtensionToMemvizResponse,
  MemvizToExtensionMsg,
  RequestId,
} from "../../messages";
import type { StackTrace, ThreadId } from "../memory";
import type { ProcessResolver } from "./resolver";

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
    const [id, promise] = this.prepareRequest<StackTrace>();

    this.sendMessage({
      kind: "get-stack-trace",
      requestId: id,
      threadId,
    });
    return await promise;
  }

  private prepareRequest<T>(): [RequestId, Promise<T>] {
    const id = this.requestId;
    this.requestId++;
    const promise = new Promise<T>((resolve, _reject) => {
      this.requestMap.set(id, resolve as (_data: unknown) => void);
    });
    return [id, promise];
  }

  private sendMessage(msg: MemvizToExtensionMsg) {
    console.log(
      `Sending request to extension (kind=${msg.kind}, id=${msg.requestId})`,
    );
    this.vscode.postMessage(msg);
  }
}
