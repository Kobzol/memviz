export type ThreadId = number;

export interface ProcessState {
  threads: ThreadId[];
}

export interface StackTrace {
  frames: StackFrame[];
}

export type FrameId = number;

export interface StackFrame {
  id: FrameId;
  name: string;
  instruction_pointer: Address;
}

export type Address = string;
export type Type = string;

export enum PlaceKind {
  Variable = "variable",
  Parameter = "parameter",
}

export interface Place {
  kind: PlaceKind;
  name: string;
  address: Address | null;
  type: Type | null;
  simpleValue: string;
}

// TODO: https://microsoft.github.io/debug-adapter-protocol/specification#Requests_ReadMemory
// TODO: https://microsoft.github.io/debug-adapter-protocol/specification#Requests_SetExpression
// TODO: https://microsoft.github.io/debug-adapter-protocol/specification#Requests_SetVariable
