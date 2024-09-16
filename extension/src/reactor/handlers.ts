interface WaitingForMainBreakpoint {
  kind: "waiting-for-main-breakpoint";
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
