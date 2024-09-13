export interface ProcessState {
    threads: ThreadState[];
}

export interface ThreadState {
    frames: StackFrame[];
}

export interface StackFrame {
    id: number;
    name: string;
}
