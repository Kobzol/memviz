import { readFileSync } from "fs";
import path from "path";
import * as vscode from "vscode";

export function getStaticFilePath(
  context: vscode.ExtensionContext,
  file: string,
): string {
  return vscode.Uri.file(path.join(context.extensionPath, "static", file))
    .fsPath;
}

export function loadStaticFile(
  context: vscode.ExtensionContext,
  file: string,
): string {
  const htmlPath = getStaticFilePath(context, file);
  return new TextDecoder("UTF-8").decode(readFileSync(htmlPath));
}

export function getCompiledFileUri(
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext,
  file: string,
): string {
  const distDirectory = vscode.Uri.joinPath(context.extensionUri, "dist");
  const scriptPath = vscode.Uri.joinPath(distDirectory, file);
  return panel.webview.asWebviewUri(scriptPath).toString();
}
