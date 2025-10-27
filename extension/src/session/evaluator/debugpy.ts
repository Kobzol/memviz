import type { DebugProtocol } from "@vscode/debugprotocol";
import type { FrameId } from "process-def";
import { type ExtractBody, stripOuterSingleQuotes } from "../../utils";
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

  async evaluate(
    expression: string,
    frameId?: FrameId,
  ): Promise<ExtractBody<DebugProtocol.EvaluateResponse>> {
    frameId = frameId ?? this.frameId;
    const result = await this.evaluateInner(
      `__import__('${this.moduleName}').try_run(lambda: __import__('${this.moduleName}').${expression})`,
      frameId,
    );
    result.result = stripOuterSingleQuotes(result.result);
    return result;
  }
}
