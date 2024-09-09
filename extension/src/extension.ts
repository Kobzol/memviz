import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
	let panel: vscode.WebviewPanel | null = null;

	context.subscriptions.push(
		vscode.commands.registerCommand("memviz.open", () => {
			if (panel !== null) {
				panel.reveal();
			} else {
				panel = vscode.window.createWebviewPanel(
					"memviz",
					"Memviz",
					vscode.ViewColumn.Beside, // Show to the side of the editor.
					{
						localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "dist")],
						enableScripts: true
					}
				);
				const scriptPath = vscode.Uri.joinPath(context.extensionUri, "dist", "visualizer.js");
				const scriptSrc = panel.webview.asWebviewUri(scriptPath);

				panel.webview.html = getWebviewContent(scriptSrc);
				panel.onDidDispose(
					() => {
						panel = null;
						console.log("Panel closing");
					},
					null,
					context.subscriptions
				);
			}
		})
	);
}

function getWebviewContent(scriptSrc: vscode.Uri) {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Memviz</title>
  </head>
  <body>
	  <script type="text/javascript" src="${scriptSrc}"></script>
  </body>
  </html>`;
}

export function deactivate() { }
