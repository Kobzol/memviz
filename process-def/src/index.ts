import type { Type } from "./type";

export type { Type } from "./type";

export type ThreadId = number;

export interface ProcessState {
  stackTrace: StackTrace;
  stackAddressRange: AddressRange | null;
}

export interface StackTrace {
  frames: StackFrame[];
}

export type FrameId = number;

export interface StackFrame {
  id: FrameId;
  // Numerical index of the stack frame
  // 0 is the topmost frame (the one where the program stopped)
  index: number;
  name: string;
}

export type Address = string;

export interface AddressRange {
  start: Address;
  end: Address;
}

export enum PlaceKind {
  Variable = "variable",
  ShadowedVariable = "shadowed",
  Parameter = "parameter",
  GlobalVariable = "global",
}

export interface Place {
  kind: PlaceKind;
  name: string;
  address: Address | null;
  type: Type;
  initialized: boolean;
}

// TODO: https://microsoft.github.io/debug-adapter-protocol/specification#Requests_ReadMemory
// TODO: https://microsoft.github.io/debug-adapter-protocol/specification#Requests_SetExpression
// TODO: https://microsoft.github.io/debug-adapter-protocol/specification#Requests_SetVariable
