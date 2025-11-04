import { SessionType } from "process-def";
import type { Uri } from "vscode";
import { getStaticFilePath } from "../resources";

export class ScriptPathProvider {
  constructor(private extensionUri: Uri) {}

  public getInitScriptPath(sessionType: SessionType): string {
    let scriptPath: string;
    if (sessionType === SessionType.GDB) {
      scriptPath = "scripts/gdb/gdb_script.py";
    } else if (sessionType === SessionType.Debugpy) {
      scriptPath = "scripts/debugpy/init.py";
    } else {
      throw new Error(`Unknown session type: ${sessionType}`);
    }
    return getStaticFilePath(this.extensionUri, scriptPath);
  }
}
