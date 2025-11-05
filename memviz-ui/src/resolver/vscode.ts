import {
  type AddressStr,
  type FrameIndex,
  SessionType,
  type StackTrace,
  type ThreadId,
} from "process-def";
import type {
  KeyValuePair,
  ObjectVal,
  Value as PythonValue,
  Variables as PythonVariables,
} from "process-def/debugpy";
import type { Place as GDBPlace } from "process-def/gdb";
import type { WebviewApi } from "vscode-webview";
import type {
  ExtensionToMemvizResponse,
  GetCollectionElementsReq,
  GetCollectionElementsRes,
  GetDictEntriesReq,
  GetDictEntriesRes,
  GetObjectReq,
  GetObjectRes,
  GetPlacesReq,
  GetPlacesRes,
  GetPythonVariablesRepresentationReq,
  GetPythonVariablesRepresentationRes,
  GetStackTraceReq,
  GetStackTraceRes,
  GetStringContentsReq,
  GetStringContentsRes,
  MemoryAllocEvent,
  MemvizToExtensionMsg,
  ReadMemoryReq,
  ReadMemoryRes,
  RequestId,
  ResolverId,
  TakeAllocEventsReq,
  TakeAllocEventsRes,
} from "../messages";
import { deserializePlaces } from "../type";
import type { ProcessResolver } from "./resolver";

type ExtractData<T extends { data: unknown }> = T["data"];

interface InFlightRequest {
  resolve: (response: unknown) => void;
  reject: (error: string) => void;
}

export class VsCodeResolver implements ProcessResolver {
  private requestId: RequestId = 0;
  private requestMap: Map<RequestId, InFlightRequest> = new Map();

  public constructor(
    private vscode: WebviewApi<unknown>,
    private resolverId: ResolverId,
    private sessionType: SessionType,
  ) {}

  handleMessage(message: ExtensionToMemvizResponse) {
    console.debug(`Received response for request ${message.requestId}`);
    if (message.resolverId !== this.resolverId) {
      console.warn("Received response for an already disposed resolver");
      return;
    }

    const request = this.requestMap.get(message.requestId);
    if (request === undefined) {
      console.warn(
        `Received response for an unknown or already handled request ${message.requestId}`,
      );
      return;
    }
    if (message.kind === "error") {
      request.reject(message.error);
    } else {
      request.resolve(message.data);
    }
  }

  async getStackTrace(threadId: ThreadId): Promise<StackTrace> {
    const res = await this.sendRequest<GetStackTraceReq, GetStackTraceRes>({
      kind: "get-stack-trace",
      threadId,
    });
    return res.stackTrace;
  }

  async getPlaces(frameIndex: FrameIndex): Promise<GDBPlace[]> {
    const res = await this.sendRequest<GetPlacesReq, GetPlacesRes>({
      kind: "get-places",
      frameIndex,
    });
    return deserializePlaces(res.places);
  }

  async createVariablesRepresentation(
    frameIndex: FrameIndex,
  ): Promise<PythonVariables> {
    if (this.sessionType !== SessionType.Debugpy) {
      throw new Error(
        "createVariablesRepresentation is only supported in debugpy sessions",
      );
    }
    const res = await this.sendRequest<
      GetPythonVariablesRepresentationReq,
      GetPythonVariablesRepresentationRes
    >({
      kind: "get-python-variables-representation",
      frameIndex,
    });

    return res.variables;
  }

  async getCollectionElements(
    id: AddressStr,
    frameIndex: number,
    startIndex: number,
    elementCount: number,
  ): Promise<PythonValue[]> {
    if (this.sessionType !== SessionType.Debugpy) {
      throw new Error(
        "getCollectionElements is only supported in debugpy sessions",
      );
    }
    const res = await this.sendRequest<
      GetCollectionElementsReq,
      GetCollectionElementsRes
    >({
      kind: "get-collection-elements",
      id,
      frameIndex,
      elementCount,
      startIndex,
    });
    return res.elements;
  }

  async getStringContents(
    id: AddressStr,
    frameIndex: number,
    startIndex: number,
    length: number,
  ): Promise<string> {
    if (this.sessionType !== SessionType.Debugpy) {
      throw new Error(
        "getStringContents is only supported in debugpy sessions",
      );
    }
    const res = await this.sendRequest<
      GetStringContentsReq,
      GetStringContentsRes
    >({
      kind: "get-string-contents",
      id,
      frameIndex,
      startIndex,
      length,
    });
    return res.contents;
  }

  async getDictEntries(
    id: AddressStr,
    frameIndex: number,
    startIndex: number,
    pairCount: number,
  ): Promise<KeyValuePair[]> {
    if (this.sessionType !== SessionType.Debugpy) {
      throw new Error("getDictEntries is only supported in debugpy sessions");
    }
    const res = await this.sendRequest<GetDictEntriesReq, GetDictEntriesRes>({
      kind: "get-dict-entries",
      id,
      frameIndex,
      startIndex,
      pairCount,
    });
    return res.entries;
  }

  async getObject(id: AddressStr, frameIndex: number): Promise<ObjectVal> {
    if (this.sessionType !== SessionType.Debugpy) {
      throw new Error("getObject is only supported in debugpy sessions");
    }
    const res = await this.sendRequest<GetObjectReq, GetObjectRes>({
      kind: "get-object",
      id,
      frameIndex,
    });
    return res.object;
  }

  async readMemory(address: AddressStr, size: number): Promise<ArrayBuffer> {
    const res = await this.sendRequest<ReadMemoryReq, ReadMemoryRes>({
      kind: "read-memory",
      address,
      size,
    });
    return res.data;
  }

  async takeAllocEvents(): Promise<MemoryAllocEvent[]> {
    const res = await this.sendRequest<TakeAllocEventsReq, TakeAllocEventsRes>({
      kind: "take-alloc-events",
    });
    return res.events;
  }

  private sendRequest<
    RequestType extends MemvizToExtensionMsg,
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
      (resolve, reject) => {
        const request = {
          resolve,
          reject,
        };
        this.requestMap.set(requestId, request as InFlightRequest);
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
