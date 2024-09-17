import type {
  Address,
  Place,
  ProcessState,
  StackTrace,
  ThreadId,
} from "process-def";

// Events from the extension
export interface VisualizeStateEvent {
  kind: "visualize-state";
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
  | VisualizeStateEvent
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

export interface GetVariablesRes extends Response {
  kind: "get-variables";
  data: {
    places: Place[];
  };
}

export type ExtensionToMemvizResponse = GetStackTraceRes | GetVariablesRes;

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

export interface GetVariablesReq extends Request {
  kind: "get-variables";
  frameIndex: number;
}

export type MemvizToExtensionReq = GetStackTraceReq | GetVariablesReq;

export type MemvizToExtensionMsg = MemvizToExtensionReq;
