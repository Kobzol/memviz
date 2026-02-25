import type {
  AddressStr,
  FrameIndex,
  StackTrace,
  StoppedPlace,
  ThreadId,
} from "process-def";
import type { Place as GDBPlace } from "process-def/gdb";
import type { WebviewApi } from "vscode-webview";
import type {
  ExtensionToMemvizResponse,
  GetDictEntriesReq,
  GetDictEntriesRes,
  GetFlatCollectionElementsReq,
  GetFlatCollectionElementsRes,
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
import { assert } from "../utils";
import type {
  RichAttribute,
  RichKeyValuePair,
  RichVariables as RichPythonVariables,
  RichValue,
} from "../visualization/debugpy/type/type";
import { rawToRichValues } from "../visualization/debugpy/type/value-mapper";
import { deserializePlaces } from "../visualization/gdb/type";
import type { ProcessResolverCore } from "./core";

type ExtractData<T extends { data: unknown }> = T["data"];

interface InFlightRequest {
  resolve: (response: unknown) => void;
  reject: (error: string) => void;
}

export class VsCodeResolver implements ProcessResolverCore {
  private requestId: RequestId = 0;
  private requestMap: Map<RequestId, InFlightRequest> = new Map();

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
    frame: StoppedPlace,
  ): Promise<RichPythonVariables> {
    const res = await this.sendRequest<
      GetPythonVariablesRepresentationReq,
      GetPythonVariablesRepresentationRes
    >({
      kind: "get-python-variables-representation",
      frame,
    });

    return {
      places: res.variables.places,
      values: rawToRichValues(res.variables.values),
    };
  }

  async getFlatCollectionElements(
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<RichValue[]> {
    const res = await this.sendRequest<
      GetFlatCollectionElementsReq,
      GetFlatCollectionElementsRes
    >({
      kind: "get-flat-collection-elements",
      id,
      startIndex,
      count,
    });
    return rawToRichValues(res.elements);
  }

  async getStringContents(
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<string> {
    const res = await this.sendRequest<
      GetStringContentsReq,
      GetStringContentsRes
    >({
      kind: "get-string-contents",
      id,
      startIndex,
      count,
    });
    return res.contents;
  }

  async getDictEntries(
    id: AddressStr,
    startIndex: number,
    count: number,
  ): Promise<RichKeyValuePair[]> {
    const res = await this.sendRequest<GetDictEntriesReq, GetDictEntriesRes>({
      kind: "get-dict-entries",
      id,
      startIndex,
      count,
    });
    return res.entries.map((entry) => ({
      key: rawToRichValues([entry.key])[0],
      value: rawToRichValues([entry.value])[0],
    }));
  }

  async getObject(id: AddressStr): Promise<RichAttribute[]> {
    const res = await this.sendRequest<GetObjectReq, GetObjectRes>({
      kind: "get-object",
      id,
    });
    assert(
      res.object.attributes !== null,
      `Object ${id} received null attributes`,
    );
    return res.object.attributes.map((attr) => ({
      name: attr.name,
      value: attr.value ? rawToRichValues([attr.value])[0] : null,
      is_descriptor: attr.is_descriptor,
    }));
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
