import type { StackFrame, StackTrace } from "process-def";
import * as React from "react";

/*display: flex;
      flex-direction: column; */
export function StackTraceComponent({
  stackTrace,
}: { stackTrace: StackTrace }) {
  return (
    <div>
      {stackTrace.frames.map((frame) => (
        <StackFrameComponent key={frame.id} frame={frame} />
      ))}
    </div>
  );
}

/*
padding: 5px;
width: 200px;
border: 1px solid #000000;
&:hover {
  background-color: #AAAAAA;
}*/
function StackFrameComponent({ frame }: { frame: StackFrame }) {
  return <div>{frame.name}</div>;
}
