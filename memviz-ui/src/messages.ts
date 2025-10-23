import type {
  AddressStr,
  FrameIndex,
  KeyValuePair,
  ObjectVal,
  ProcessState,
  SessionType,
  StackTrace,
  ThreadId,
} from "process-def";
import type { PythonVal, PythonVariables } from "process-def";
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

export interface GetSequenceTypeElementsRes extends Response {
  kind: "get-sequence-type-elements";
  data: {
    elements: PythonVal[];
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

export type ExtensionToMemvizResponse =
  | GetStackTraceRes
  | GetPlacesRes
  | GetPythonVariablesRepresentationRes
  | GetSequenceTypeElementsRes
  | GetDictPairsRes
  | GetStringContentsRes
  | GetObjectRes
  | ReadMemoryRes
  | TakeAllocEventsRes
  | ErrorRes;

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

export interface GetSequenceTypeElementsReq extends Request {
  kind: "get-sequence-type-elements";
  reference: string;
  frameIndex: FrameIndex;
  elementCount: number;
  startIndex: number;
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
  | GetSequenceTypeElementsReq
  | GetDictPairsReq
  | GetStringContentsReq
  | GetObjectReq
  | ReadMemoryReq
  | TakeAllocEventsReq;
