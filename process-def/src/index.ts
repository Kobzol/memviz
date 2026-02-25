export enum SessionType {
  GDB = "GDB",
  Debugpy = "Debugpy",
}

export type ThreadId = number;

export interface StackTrace {
  frames: StackFrame[];
}

export type FrameId = number;
// Numerical index of the stack frame
// 0 is the topmost frame (the one where the program stopped)
export type FrameIndex = number;

export interface ProcessState {
  stackTrace: StackTrace;
  stackAddressRange: AddressRange | null;
}

export interface StackFrame {
  id: FrameId;
  index: FrameIndex;
  name: string;
  line: number;
  file: string | null;
}

export interface FrameLocation {
  name: string;
  line: number;
}

export interface StoppedPlace {
  id: FrameId;
  place: FrameLocation;
}

export type AddressStr = string;
export type Address = bigint;

export interface AddressRange {
  start: AddressStr;
  end: AddressStr;
}
