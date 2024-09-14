import type { ProcessState, StackTrace, ThreadId } from "./process/memory";

// Events from the extension
export interface VisualizeStateEvent {
  kind: "visualize-state";
  state: ProcessState;
}

export type ExtensionEvent = VisualizeStateEvent;

// Responses to requests to the extension
export interface GetStackTraceRes {
  kind: "get-stack-trace";
  requestId: RequestId;
  data: {
    stackTrace: StackTrace;
  };
}

export type ExtensionToMemvizResponse = GetStackTraceRes;

// Any message from the extension
export type ExtensionToMemvizMsg = ExtensionEvent | ExtensionToMemvizResponse;

// Requests to the extension
export type RequestId = number;

export interface GetStackTraceReq {
  kind: "get-stack-trace";
  requestId: RequestId;
  threadId: ThreadId;
}

type MemvizToExtensionReq = GetStackTraceReq;

export type MemvizToExtensionMsg = MemvizToExtensionReq;
