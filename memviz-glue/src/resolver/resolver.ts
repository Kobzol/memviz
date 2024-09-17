import type { FrameId, Place, StackTrace, ThreadId } from "process-def";

export interface ProcessResolver {
  getStackTrace(threadId: ThreadId): Promise<StackTrace>;
  getPlaces(frameId: FrameId): Promise<Place[]>;
}
