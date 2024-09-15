import type { FrameId, Place, StackTrace, ThreadId } from "process-def";

export interface ProcessResolver {
  getStackTrace(threadId: ThreadId): Promise<StackTrace>;
  getVariables(frameId: FrameId): Promise<Place[]>;
}
