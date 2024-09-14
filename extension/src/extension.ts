import { readFileSync } from "fs";
import path from "path";
import * as vscode from "vscode";

import { Context } from "./context";

export function activate(context: vscode.ExtensionContext) {
  let ctx: Context | null = null;

  const trackerDisposable = vscode.debug.registerDebugAdapterTrackerFactory(
    "cppdbg",
    {
      createDebugAdapterTracker(session: vscode.DebugSession) {
        return {
          onWillReceiveMessage(message) {
            // console.log("RECEIVED message:", message);
          },
          onDidSendMessage: async (message) => {
            if (ctx === null) {
              return;
            }
            await ctx.handleDebugMessage(message);
          },
        };
      },
    },
  );
  context.subscriptions.push(trackerDisposable);

  const startDisposable = vscode.debug.onDidStartDebugSession((session) => {
    if (ctx !== null) {
      ctx.dispose();
    }
    console.log("Opening memviz");

    const panel = createPanel(context);
    panel.onDidDispose(
      () => {
        console.log("Closing memviz (panel closed)");
        ctx = null;
      },
      null,
      context.subscriptions,
    );
    ctx = new Context(panel, session);
    panel.webview.onDidReceiveMessage(
      (message) => {
        if (ctx !== null) {
          ctx.handleWebviewMessage(message);
        }
      },
      undefined,
      context.subscriptions,
    );
  });
  context.subscriptions.push(startDisposable);

  const endDisposable = vscode.debug.onDidTerminateDebugSession(() => {
    console.log("Closing memviz (debug session terminated)");
    if (ctx !== null) {
      ctx.dispose();
      ctx = null;
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
      retainContextWhenHidden: true,
    },
  );
  const htmlPath = vscode.Uri.file(
    path.join(context.extensionPath, "static", "index.html"),
  ).fsPath;
  const html = new TextDecoder("UTF-8").decode(readFileSync(htmlPath));

  const scriptPath = vscode.Uri.joinPath(distDirectory, "memviz-glue.js");
  const scriptSrc = panel.webview.asWebviewUri(scriptPath).toString();

  panel.webview.html = html
    .replaceAll("$SCRIPT", scriptSrc)
    .replaceAll("$CSPSOURCE", panel.webview.cspSource);
  return panel;
}

export function deactivate() {}
