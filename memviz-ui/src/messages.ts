import type {
  AddressStr,
  FrameIndex,
  ProcessState,
  SessionType,
  StackTrace,
  ThreadId,
} from "process-def";
import type {
  KeyValuePair,
  ObjectVal,
  Value as PythonValue,
  Variables as PythonVariables,
} from "process-def/debugpy";
import type { InternedPlaceList } from "./type";

export type ProcessStoppedEvent = {
  kind: "process-stopped";
  sessionType: SessionType;
  state: ProcessState;
};

// Events from the extension
export type ExtensionEvent = ProcessStoppedEvent;

// Responses to requests to the extension
export interface Response {
  requestId: RequestId;
  resolverId: ResolverId;
}

export interface GetStackTraceRes extends Response {
  kind: "get-stack-trace";
  data: {
    stackTrace: StackTrace;
  };
}

export interface GetPlacesRes extends Response {
  kind: "get-places";
  data: {
    places: InternedPlaceList;
  };
}

export interface GetPythonVariablesRepresentationRes extends Response {
  kind: "get-python-variables-representation";
  data: {
    variables: PythonVariables;
  };
}

export interface GetCollectionTypeElementsRes extends Response {
  kind: "get-collection-type-elements";
  data: {
    elements: PythonValue[];
  };
}

export interface GetDictPairsRes extends Response {
  kind: "get-dict-pairs";
  data: {
    pairs: KeyValuePair[];
  };
}

export interface GetStringContentsRes extends Response {
  kind: "get-string-contents";
  data: {
    contents: string;
  };
}

export interface GetObjectRes extends Response {
  kind: "get-object";
  data: {
    object: ObjectVal;
  };
}

export interface ReadMemoryRes extends Response {
  kind: "read-memory";
  data: {
    data: ArrayBuffer;
  };
}

export interface TakeAllocEventsRes extends Response {
  kind: "take-alloc-events";
  data: {
    events: MemoryAllocEvent[];
  };
}

interface MemoryAllocatedEvent {
  kind: "mem-allocated";
  address: AddressStr;
  size: number;
}

interface MemoryFreedEvent {
  kind: "mem-freed";
  address: AddressStr;
}

export type MemoryAllocEvent = MemoryAllocatedEvent | MemoryFreedEvent;

export interface ErrorRes extends Response {
  kind: "error";
  error: string;
}

export type ExtensionToMemvizCommonResponse =
  | GetStackTraceRes
  | ReadMemoryRes
  | ErrorRes;

export type ExtensionToMemvizGDBResponse = GetPlacesRes | TakeAllocEventsRes;

export type ExtensionToMemvizDebugpyResponse =
  | GetPythonVariablesRepresentationRes
  | GetCollectionTypeElementsRes
  | GetDictPairsRes
  | GetStringContentsRes
  | GetObjectRes;

export type ExtensionToMemvizResponse =
  | ExtensionToMemvizCommonResponse
  | ExtensionToMemvizGDBResponse
  | ExtensionToMemvizDebugpyResponse;

// Any message from the extension
export type ExtensionToMemvizMsg = ExtensionEvent | ExtensionToMemvizResponse;

// Requests to the extension
export type RequestId = number;
export type ResolverId = number;

interface Request {
  requestId: RequestId;
  resolverId: ResolverId;
}

export interface GetStackTraceReq extends Request {
  kind: "get-stack-trace";
  threadId: ThreadId;
}

export interface GetPlacesReq extends Request {
  kind: "get-places";
  frameIndex: FrameIndex;
}

export interface GetPythonVariablesRepresentationReq extends Request {
  kind: "get-python-variables-representation";
  frameIndex: FrameIndex;
}

export interface GetCollectionTypeElementsReq extends Request {
  kind: "get-collection-type-elements";
  reference: string;
  frameIndex: FrameIndex;
  startIndex: number;
  elementCount: number;
}

export interface GetDictPairsReq extends Request {
  kind: "get-dict-pairs";
  reference: string;
  frameIndex: FrameIndex;
  startIndex: number;
  pairCount: number;
}

export interface GetStringContentsReq extends Request {
  kind: "get-string-contents";
  reference: string;
  frameIndex: FrameIndex;
  startIndex: number;
  length: number;
}

export interface GetObjectReq extends Request {
  kind: "get-object";
  reference: string;
  frameIndex: FrameIndex;
}

export interface ReadMemoryReq extends Request {
  kind: "read-memory";
  address: AddressStr;
  size: number;
}

export interface TakeAllocEventsReq extends Request {
  kind: "take-alloc-events";
}

export type MemvizToExtensionMsg =
  | GetStackTraceReq
  | GetPlacesReq
  | GetPythonVariablesRepresentationReq
  | GetCollectionTypeElementsReq
  | GetDictPairsReq
  | GetStringContentsReq
  | GetObjectReq
  | ReadMemoryReq
  | TakeAllocEventsReq;
