import type {
  AddressStr,
  ProcessState,
  StackTrace,
  ThreadId,
} from "process-def";
import type { InternedPlaceList } from "./type";

// Events from the extension
export interface ProcessStoppedEvent {
  kind: "process-stopped";
  state: ProcessState;
}

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
  frameIndex: number;
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
  | ReadMemoryReq
  | TakeAllocEventsReq;
