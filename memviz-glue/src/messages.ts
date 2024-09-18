import type {
  Address,
  Place,
  ProcessState,
  StackTrace,
  ThreadId,
} from "process-def";

// Events from the extension
export interface ProcessStoppedEvent {
  kind: "process-stopped";
  state: ProcessState;
}

export interface MemoryAllocatedEvent {
  kind: "mem-allocated";
  address: Address;
  size: number;
}

export interface MemoryFreedEvent {
  kind: "mem-freed";
  address: Address;
}

export type ExtensionEvent =
  | ProcessStoppedEvent
  | MemoryAllocatedEvent
  | MemoryFreedEvent;

// Responses to requests to the extension
interface Response {
  requestId: RequestId;
}

export interface GetStackTraceRes extends Response {
  kind: "get-stack-trace";
  data: {
    stackTrace: StackTrace;
  };
}

export interface GetPlacesRes extends Response {
  kind: "get-variables";
  data: {
    places: Place[];
  };
}

export interface ReadMemoryRes extends Response {
  kind: "read-memory";
  data: {
    data: ArrayBuffer;
  };
}

export type ExtensionToMemvizResponse =
  | GetStackTraceRes
  | GetPlacesRes
  | ReadMemoryRes;

// Any message from the extension
export type ExtensionToMemvizMsg = ExtensionEvent | ExtensionToMemvizResponse;

// Requests to the extension
export type RequestId = number;

interface Request {
  requestId: RequestId;
}

export interface GetStackTraceReq extends Request {
  kind: "get-stack-trace";
  threadId: ThreadId;
}

export interface GetPlacesReq extends Request {
  kind: "get-variables";
  frameIndex: number;
}

export interface ReadMemoryReq extends Request {
  kind: "read-memory";
  address: string;
  size: number;
}

export type MemvizToExtensionReq =
  | GetStackTraceReq
  | GetPlacesReq
  | ReadMemoryReq;

export type MemvizToExtensionMsg = MemvizToExtensionReq;
