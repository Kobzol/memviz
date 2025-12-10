import type { DebugProtocol } from "@vscode/debugprotocol";
import type { FrameId } from "process-def";
import type { ExtractBody } from "../../utils";
import { Evaluator } from "./evaluator";

export class DebugpyEvaluator extends Evaluator {
  moduleName = "memviz_get_variables_info";

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
      `__import__('${this.moduleName}').try_run(lambda: __import__('${this.moduleName}').${expression})`,
      frameId,
    );
    return result;
  }
}
