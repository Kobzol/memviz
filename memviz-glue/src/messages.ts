import { ProcessState } from "./process/memory";

export interface VisualizeStateMsg {
    kind: "visualize-state";
    state: ProcessState;
}

export type MemvizMsg = VisualizeStateMsg;
