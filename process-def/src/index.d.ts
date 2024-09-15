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
export declare enum PlaceKind {
    Variable = 0,
    Parameter = 1
}
export interface Place {
    kind: PlaceKind;
}
//# sourceMappingURL=index.d.ts.map