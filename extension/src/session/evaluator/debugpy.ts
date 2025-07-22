import { Evaluator } from "./evaluator";
import type { FrameId } from "process-def";
import { type ExtractBody, stripOuterSingleQuotes } from "../../utils";
import type { DebugProtocol } from "@vscode/debugprotocol";

export class DebugpyEvaluator extends Evaluator {
  async init(frameId: FrameId) {
    return await this.evaluateInner(
      `exec(open("${this.scriptPath}").read(), {'__file__': '${this.scriptPath}'})`,
    );
  }

  async evaluate(
    expression: string,
    frameId?: FrameId,
  ): Promise<ExtractBody<DebugProtocol.EvaluateResponse>> {
    const result = await this.evaluateInner(
      `__import__('memviz_get_variables_info').try_run(lambda: __import__('memviz_get_variables_info').${expression})`,
      frameId,
    );
    result.result = stripOuterSingleQuotes(result.result);
    return result;
  }
}
