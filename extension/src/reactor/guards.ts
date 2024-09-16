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

export function isSetBreakpointsRequest(
  message: DebugProtocol.ProtocolMessage,
): message is DebugProtocol.SetBreakpointsRequest {
  return isRequest(message) && message.command === "setBreakpoints";
}

export function isNextRequest(
  message: DebugProtocol.ProtocolMessage,
): message is DebugProtocol.NextRequest {
  return isRequest(message) && message.command === "next";
}

export function isStepInRequest(
  message: DebugProtocol.ProtocolMessage,
): message is DebugProtocol.StepInRequest {
  return isRequest(message) && message.command === "stepIn";
}

export function isStepOutRequest(
  message: DebugProtocol.ProtocolMessage,
): message is DebugProtocol.StepOutRequest {
  return isRequest(message) && message.command === "stepOut";
}

export function isStoppedEvent(
  message: DebugProtocol.ProtocolMessage,
): message is DebugProtocol.StoppedEvent {
  return isEvent(message) && message.event === "stopped";
}
