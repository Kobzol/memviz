import type { DebugProtocol } from "@vscode/debugprotocol";

export function isRequest(
  message: DebugProtocol.ProtocolMessage,
): message is DebugProtocol.Request {
  return message.type === "request";
}

export function isEvent(
  message: DebugProtocol.ProtocolMessage,
): message is DebugProtocol.Event {
  return message.type === "event";
}

export function isResponse(
  message: DebugProtocol.ProtocolMessage,
): message is DebugProtocol.Response {
  return message.type === "response";
}

export function isSetFunctionBreakpointsRequest(
  message: DebugProtocol.ProtocolMessage,
): message is DebugProtocol.SetFunctionBreakpointsRequest {
  return isRequest(message) && message.command === "setFunctionBreakpoints";
}

export function isSetFunctionBreakpointsResponse(
  message: DebugProtocol.ProtocolMessage,
): message is DebugProtocol.SetFunctionBreakpointsResponse {
  return isResponse(message) && message.command === "setFunctionBreakpoints";
}

export function isStoppedEvent(
  message: DebugProtocol.ProtocolMessage,
): message is DebugProtocol.StoppedEvent {
  return isEvent(message) && message.event === "stopped";
}
