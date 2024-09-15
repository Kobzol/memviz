import type {
  FrameId,
  Place,
  ProcessState,
  StackTrace,
  ThreadId,
} from "process-def/src";

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

export interface GetVariablesRes {
  kind: "get-variables";
  requestId: RequestId;
  data: {
    places: Place[];
  };
}

export type ExtensionToMemvizResponse = GetStackTraceRes | GetVariablesRes;

// Any message from the extension
export type ExtensionToMemvizMsg = ExtensionEvent | ExtensionToMemvizResponse;

// Requests to the extension
export type RequestId = number;

export interface GetStackTraceReq {
  kind: "get-stack-trace";
  requestId: RequestId;
  threadId: ThreadId;
}

export interface GetVariablesReq {
  kind: "get-variables";
  requestId: RequestId;
  frameId: FrameId;
}

type MemvizToExtensionReq = GetStackTraceReq | GetVariablesReq;

export type MemvizToExtensionMsg = MemvizToExtensionReq;
