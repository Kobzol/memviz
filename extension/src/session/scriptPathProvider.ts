import type { Uri } from "vscode";
import { getStaticFilePath } from "../resources";
import { SessionType } from "./sessionType";

export class ScriptPathProvider {
  constructor(
    private extensionUri: Uri
  ) { }

  public getInitScriptPath(sessionType: SessionType): string {
    switch (sessionType) {
      case SessionType.GDB:
        return getStaticFilePath(
          this.extensionUri,
          "scripts/gdb/gdb_script.py",
        );
      case SessionType.Debugpy:
        return getStaticFilePath(
          this.extensionUri,
          "scripts/debugpy/init.py",
        );
      default:
        throw new Error("Unknown session type");
    }
  }
}