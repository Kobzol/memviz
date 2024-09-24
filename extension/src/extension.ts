import * as vscode from "vscode";

import type { DebugProtocol } from "@vscode/debugprotocol";
import { Reactor } from "./reactor";
import { DebuggerSession } from "./session";
import { MenuViewProvider } from "./menu/menu";
import {
  getCompiledFileUri,
  getStaticFilePath,
  loadStaticFile,
} from "./resources";

export function activate(context: vscode.ExtensionContext) {
  const menuProvider = new MenuViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      MenuViewProvider.viewType,
      menuProvider,
    ),
  );

  let handler: Reactor | null = null;

  const gdbScriptPath = getStaticFilePath(context, "gdb_script.py");

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
  const panel = vscode.window.createWebviewPanel(
    "memviz",
    "Memviz",
    vscode.ViewColumn.Beside, // Show to the side of the editor.
    {
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, "dist"),
        vscode.Uri.joinPath(context.extensionUri, "static"),
      ],
      enableScripts: true,
      // Do not remove the state of the tab when it becomes hidden
      retainContextWhenHidden: true,
    },
  );

  const html = loadStaticFile(context, "index.html");
  const scriptSrc = getCompiledFileUri(panel, context, "index.js");
  const styleSrc = getCompiledFileUri(panel, context, "index.css");

  panel.webview.html = html
    .replaceAll("$SCRIPT", scriptSrc)
    .replaceAll("$STYLE", styleSrc)
    .replaceAll("$CSPSOURCE", panel.webview.cspSource);
  return panel;
}

export function deactivate() {}
