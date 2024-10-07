import type { Type } from "./type";

export type {
  Type,
  TyArray,
  TyBool,
  TyFloat,
  TyInt,
  TyPtr,
  TyEnum,
  TyStruct,
} from "./type";

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
  line: number;
  file: string | null;
}

export type AddressStr = string;
export type Address = bigint;

export interface AddressRange {
  start: AddressStr;
  end: AddressStr;
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
  address: AddressStr | null;
  type: Type;
  initialized: boolean;
  line: number;
}
