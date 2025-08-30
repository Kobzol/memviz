import type { DebugProtocol } from "@vscode/debugprotocol";
import type { FrameId } from "process-def";
import type { ExtractBody } from "../../utils";
import { Evaluator } from "./evaluator";

export class GDBEvaluator extends Evaluator {
  async init(frameId: FrameId) {
    return await this.evaluateInner(`source ${this.scriptPath}`, frameId);
  }

  async evaluate(
    expression: string,
    frameId?: FrameId,
  ): Promise<ExtractBody<DebugProtocol.EvaluateResponse>> {
    return await this.evaluateInner(`py print(try_run(lambda: ${expression}))`);
  }

  protected getExpression(expression: string): string {
    return `-exec ${expression}`;
  }
}
