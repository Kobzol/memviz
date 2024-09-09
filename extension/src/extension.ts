import { readFileSync } from "fs";
import path from "path";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
	let panel: vscode.WebviewPanel | null = null;

	const startDisposable = vscode.debug.onDidStartDebugSession(() => {
		if (panel !== null) {
			panel.reveal();
		} else {
			console.log("Opening memviz");

			panel = createPanel(context);
			panel.onDidDispose(
				() => {
					panel = null;
				},
				null,
				context.subscriptions
			);
		}
	});
	context.subscriptions.push(startDisposable);

	const endDisposable = vscode.debug.onDidTerminateDebugSession(() => {
		console.log("Closing memviz");
		if (panel !== null) {
			panel.dispose();
		}
	});
	context.subscriptions.push(endDisposable);
}

function createPanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
	const distDirectory = vscode.Uri.joinPath(context.extensionUri, "dist");
	const panel = vscode.window.createWebviewPanel(
		"memviz",
		"Memviz",
		vscode.ViewColumn.Beside, // Show to the side of the editor.
		{
			localResourceRoots: [
				distDirectory,
				vscode.Uri.joinPath(context.extensionUri, "static"),
			],
			enableScripts: true,
			// Do not remove the state of the tab when it becomes hidden
			retainContextWhenHidden: true
		}
	);
	const htmlPath = vscode.Uri.file(path.join(context.extensionPath, "static", "index.html")).fsPath;
	const html = new TextDecoder("UTF-8").decode(readFileSync(htmlPath));

	const scriptPath = vscode.Uri.joinPath(distDirectory, "memviz-glue.js");
	const scriptSrc = panel.webview.asWebviewUri(scriptPath).toString();

	panel.webview.html = html.replaceAll("$SCRIPT", scriptSrc).replaceAll("$CSPSOURCE", panel.webview.cspSource);
	panel.webview.onDidReceiveMessage(
		message => {
			console.log("Extension received message: ", message);
		},
		undefined,
		context.subscriptions
	);
	panel.webview.postMessage({ command: "refactor" });
	return panel;
}

export function deactivate() { }
