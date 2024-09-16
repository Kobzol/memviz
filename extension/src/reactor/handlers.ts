interface WaitingForMainBreakpoint {
  kind: "waiting-for-main-breakpoint";
  mainBreakpointId: number | null;
}

interface WaitingForSetFunctionBreakpointsResponse {
  kind: "waiting-for-set-function-breakpoints";
}

interface Initialized {
  kind: "initialized";
}

export type Status =
  | WaitingForSetFunctionBreakpointsResponse
  | WaitingForMainBreakpoint
  | Initialized;

export interface HandlerResult {
  status: Status;
}
