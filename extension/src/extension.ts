import { readFileSync } from "fs";
import path from "path";
import * as vscode from "vscode";

import type { DebugProtocol } from "@vscode/debugprotocol";
import { Reactor } from "./reactor";
import { DebuggerSession } from "./session";

export function activate(context: vscode.ExtensionContext) {
  let handler: Reactor | null = null;

  const gdbScriptPath = vscode.Uri.file(
    path.join(context.extensionPath, "static", "gdb_script.py"),
  ).fsPath;

  const trackerDisposable = vscode.debug.registerDebugAdapterTrackerFactory(
    "cppdbg",
    {
      createDebugAdapterTracker(session: vscode.DebugSession) {
        return {
          onWillReceiveMessage: async (message: DebugProtocol.Request) => {
            if (handler === null) {
              return;
            }
            await handler.handleMessageFromClient(message);
          },
          onDidSendMessage: (
            message: DebugProtocol.Event | DebugProtocol.Response,
          ) => {
            if (handler === null) {
              return;
            }
            handler.handleMessageToClient(message);
          },
        };
      },
    },
  );
  context.subscriptions.push(trackerDisposable);

  const startDisposable = vscode.debug.onDidStartDebugSession((session) => {
    if (handler !== null) {
      handler.dispose();
    }
    console.log("Opening memviz");

    const panel = createPanel(context);
    panel.onDidDispose(
      () => {
        console.log("Closing memviz (panel closed)");
        handler = null;
      },
      null,
      context.subscriptions,
    );
    handler = new Reactor(panel, new DebuggerSession(session), gdbScriptPath);
    panel.webview.onDidReceiveMessage(
      (message) => {
        if (handler !== null) {
          handler.handleWebviewMessage(message);
        }
      },
      undefined,
      context.subscriptions,
    );
  });
  context.subscriptions.push(startDisposable);

  const endDisposable = vscode.debug.onDidTerminateDebugSession(() => {
    console.log("Closing memviz (debug session terminated)");
    if (handler !== null) {
      handler.dispose();
      handler = null;
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
