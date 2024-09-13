import { StackTrace, ThreadId } from "../memory";

export interface ProcessResolver {
    getStackTrace(threadId: ThreadId): Promise<StackTrace>;
}
