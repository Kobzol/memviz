export type ThreadId = number;

export interface ProcessState {
  threads: ThreadId[];
}

export interface StackTrace {
  frames: StackFrame[];
}

export interface StackFrame {
  id: number;
  name: string;
}
