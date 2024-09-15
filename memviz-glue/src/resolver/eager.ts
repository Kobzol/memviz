import type { FrameId, Place, StackTrace, ThreadId } from "process-def/src";
import type { ProcessResolver } from "./resolver";

export interface FullThreadState {
  stackTrace: FullStackTrace;
}

interface FullStackTrace {
  frames: FullStackFrame[];
}

interface FullStackFrame {
  id: number;
  name: string;
}

export class EagerResolver implements ProcessResolver {
  constructor(
    private processState: { [threadId: ThreadId]: FullThreadState },
  ) {}

  getStackTrace(threadId: ThreadId): Promise<StackTrace> {
    return Promise.resolve(this.processState[threadId].stackTrace);
  }

  getVariables(frameId: FrameId): Promise<Place[]> {
    throw new Error("Method not implemented.");
  }
}
