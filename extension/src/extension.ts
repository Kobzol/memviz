import { readFileSync } from "fs";
import path from "path";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
	let panel: vscode.WebviewPanel | null = null;

	context.subscriptions.push(
		vscode.commands.registerCommand("memviz.open", () => {
			if (panel !== null) {
				panel.reveal();
			} else {
				const distDirectory = vscode.Uri.joinPath(context.extensionUri, "dist");
				panel = vscode.window.createWebviewPanel(
					"memviz",
					"Memviz",
					vscode.ViewColumn.Beside, // Show to the side of the editor.
					{
						localResourceRoots: [
							distDirectory,
							vscode.Uri.joinPath(context.extensionUri, "static"),
						],
						enableScripts: true
					}
				);
				const htmlPath = vscode.Uri.file(path.join(context.extensionPath, "static", "index.html")).fsPath;
				const html = new TextDecoder("UTF-8").decode(readFileSync(htmlPath));

				const scriptPath = vscode.Uri.joinPath(distDirectory, "memviz-glue.js");
				const scriptSrc = panel.webview.asWebviewUri(scriptPath).toString();

				panel.webview.html = html.replaceAll("$SCRIPT", scriptSrc);
				panel.webview.postMessage({ command: "refactor" });
				panel.onDidDispose(
					() => {
						panel = null;
					},
					null,
					context.subscriptions
				);
			}
		})
	);
}

export function deactivate() { }
