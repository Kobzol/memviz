import type { DebugProtocol } from "@vscode/debugprotocol";
import type { FrameId } from "process-def";
import type { DebugSession } from "vscode";
import type { ExtractBody } from "../../utils";

export abstract class Evaluator {
  constructor(
    protected session: DebugSession,
    protected scriptPath: string,
  ) {}

  abstract init(
    frameId: FrameId,
  ): Promise<ExtractBody<DebugProtocol.EvaluateResponse>>;
  abstract evaluate(
    expression: string,
    frameId?: FrameId,
  ): Promise<ExtractBody<DebugProtocol.EvaluateResponse>>;

  public async customRequest<T>(request: string, args?: unknown): Promise<T> {
    const start = performance.now();
    const result = await this.session.customRequest(request, args);
    const duration = performance.now() - start;
    // console.debug(
    // `Command ${request} took ${duration.toFixed(2)}ms, args:`,
    // args,
    // );
    return result as T;
  }

  protected getExpression(expression: string): string {
    return expression;
  }

  protected async evaluateInner(
    expression: string,
    frameId?: FrameId,
  ): Promise<ExtractBody<DebugProtocol.EvaluateResponse>> {
    const args: DebugProtocol.EvaluateArguments = {
      expression: this.getExpression(expression),
      frameId,
      context: "repl",
    };
    return await this.customRequest("evaluate", args);
  }
}
