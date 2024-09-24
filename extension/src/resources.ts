import { readFileSync } from "fs";
import path from "path";
import * as vscode from "vscode";

export function getStaticFilePath(
  extensionUri: vscode.Uri,
  file: string,
): string {
  return vscode.Uri.file(path.join(extensionUri.fsPath, "static", file)).fsPath;
}

export function loadStaticFile(extensionUri: vscode.Uri, file: string): string {
  const htmlPath = getStaticFilePath(extensionUri, file);
  return new TextDecoder("UTF-8").decode(readFileSync(htmlPath));
}

export function getFileUri(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  file: string,
  directory = "dist",
): string {
  const distDirectory = vscode.Uri.joinPath(extensionUri, directory);
  const scriptPath = vscode.Uri.joinPath(distDirectory, file);
  return webview.asWebviewUri(scriptPath).toString();
}
