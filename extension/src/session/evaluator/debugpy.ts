import type { DebugProtocol } from "@vscode/debugprotocol";
import type { FrameId } from "process-def";
import type { ExtractBody } from "../../utils";
import { Evaluator } from "./evaluator";

export class DebugpyEvaluator extends Evaluator {
  moduleName = "memviz_get_variables_info";
  frameId: FrameId | undefined;

  async init(frameId: FrameId) {
    this.frameId = frameId;
    return await this.evaluateInner(
      `exec(open("${this.scriptPath}").read(), {'__file__': '${this.scriptPath}'})`,
    );
  }

  private evaluateResultToJsonString(evaluateResult: string): string {
    // repr() adds quotes around the string
    evaluateResult = evaluateResult.slice(1, -1);
    return atob(evaluateResult);
  }

  async evaluate(
    expression: string,
    frameId?: FrameId,
  ): Promise<ExtractBody<DebugProtocol.EvaluateResponse>> {
    frameId = frameId ?? this.frameId;
    const result = await this.evaluateInner(
      `__import__('${this.moduleName}').try_run(lambda: __import__('${this.moduleName}').${expression})`,
      frameId,
    );
    // Debugpy's evaluate returns Python repr() of the string result,
    // which can break JSON parsing,
    // so the script encodes the result JSON string in base64
    result.result = this.evaluateResultToJsonString(result.result);
    return result;
  }
}
