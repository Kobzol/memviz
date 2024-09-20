import type { AddressStr, Place, StackTrace, ThreadId } from "process-def";
import type { WebviewApi } from "vscode-webview";
import type {
  ExtensionToMemvizResponse,
  GetPlacesReq,
  GetPlacesRes,
  GetStackTraceReq,
  GetStackTraceRes,
  MemvizToExtensionMsg,
  MemvizToExtensionRequest,
  ReadMemoryReq,
  ReadMemoryRes,
  RequestId,
  ResolverId,
} from "../messages";
import type { ProcessResolver } from "./resolver";

type ExtractData<T extends { data: unknown }> = T["data"];

export class VsCodeResolver implements ProcessResolver {
  private requestId: RequestId = 0;
  private requestMap: Map<RequestId, (response: unknown) => void> = new Map();

  public constructor(
    private vscode: WebviewApi<unknown>,
    private resolverId: ResolverId,
  ) {}

  handleMessage(message: ExtensionToMemvizResponse) {
    console.debug(`Received response for request ${message.requestId}`);
    if (message.resolverId !== this.resolverId) {
      console.warn("Received response for an already disposed resolver");
      return;
    }

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

  async getPlaces(frameIndex: number): Promise<Place[]> {
    const res = await this.sendRequest<GetPlacesReq, GetPlacesRes>({
      kind: "get-variables",
      frameIndex,
    });
    return res.places;
  }

  async readMemory(address: AddressStr, size: number): Promise<ArrayBuffer> {
    const res = await this.sendRequest<ReadMemoryReq, ReadMemoryRes>({
      kind: "read-memory",
      address,
      size,
    });
    return res.data;
  }

  private sendRequest<
    RequestType extends MemvizToExtensionRequest,
    ResponseType extends { data: unknown },
  >(
    request: Omit<RequestType, "requestId" | "resolverId">,
  ): Promise<ExtractData<ResponseType>> {
    const requestId = this.requestId;
    this.requestId++;

    this.sendMessage({
      ...request,
      requestId,
      resolverId: this.resolverId,
    } as RequestType);

    const promise = new Promise<ExtractData<ResponseType>>(
      (resolve, _reject) => {
        this.requestMap.set(requestId, resolve as (_data: unknown) => void);
      },
    );
    return promise;
  }

  private sendMessage(msg: MemvizToExtensionMsg) {
    console.debug(
      `Sending request to extension (kind=${msg.kind}, id=${msg.requestId})`,
    );
    this.vscode.postMessage(msg);
  }
}
