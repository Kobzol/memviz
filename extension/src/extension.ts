import * as vscode from "vscode";

import type { DebugProtocol } from "@vscode/debugprotocol";
import { MenuViewProvider } from "./menu/menu";
import { loadSettings, saveSettings } from "./menu/storage";
import { MessageQueue, MessageType } from "./messageQueue";
import { Reactor } from "./reactor";
import { getFileUri, loadStaticFile } from "./resources";
import { DebugpyDebuggerSession } from "./session/debugpy";
import type { Evaluator } from "./session/evaluator/evaluator";
import type { GDBEvaluator } from "./session/evaluator/gdb";
import { GDBDebuggerSession } from "./session/gdb";
import { ScriptPathProvider } from "./session/scriptPathProvider";
import type { DebuggerSession } from "./session/session";

export function activate(context: vscode.ExtensionContext) {
  let settings = loadSettings(context);
  console.log("Memviz settings loaded", settings);

  const menuProvider = new MenuViewProvider(
    context.extensionUri,
    settings,
    (newSettings) => {
      settings = newSettings;
      saveSettings(context, newSettings);
    },
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      MenuViewProvider.viewType,
      menuProvider,
    ),
  );

  let handler: Reactor<Evaluator, DebuggerSession<Evaluator>> | null = null;

  const messageQueue = new MessageQueue();

  function createTrackerFactory(debuggerType: string): vscode.Disposable {
    return vscode.debug.registerDebugAdapterTrackerFactory(debuggerType, {
      createDebugAdapterTracker(session: vscode.DebugSession) {
        if (!settings.enabled) return undefined;
        return {
          onWillReceiveMessage: (message: DebugProtocol.Request) => {
            messageQueue.enqueue(message, MessageType.Incoming);
          },
          onDidSendMessage: (
            message: DebugProtocol.Event | DebugProtocol.Response,
          ) => {
            messageQueue.enqueue(message, MessageType.Outgoing);
          },
        };
      },
    });
  }

  context.subscriptions.push(createTrackerFactory("cppdbg"));
  context.subscriptions.push(createTrackerFactory("debugpy"));

  const startDisposable = vscode.debug.onDidStartDebugSession((session) => {
    if (!settings.enabled) return;

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

    const scriptPathProvider = new ScriptPathProvider(context.extensionUri);

    if (session.type === "cppdbg") {
      const debuggerSession = new GDBDebuggerSession(
        session,
        scriptPathProvider,
      );
      handler = new Reactor<GDBEvaluator, GDBDebuggerSession>(
        panel,
        debuggerSession,
        settings,
      );
    } else if (session.type === "debugpy") {
      const debuggerSession = new DebugpyDebuggerSession(
        session,
        scriptPathProvider,
      );
      handler = new Reactor<Evaluator, DebugpyDebuggerSession>(
        panel,
        debuggerSession,
        settings,
      );
    } else {
      console.error(`Unsupported debugger type: ${session.type}`);
      return;
    }

    messageQueue.setHandler(handler);

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
    messageQueue.clear();
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

  const html = loadStaticFile(context.extensionUri, "index.html");
  const scriptSrc = getFileUri(panel.webview, context.extensionUri, "index.js");
  const styleSrc = getFileUri(panel.webview, context.extensionUri, "index.css");

  panel.webview.html = html
    .replaceAll("$SCRIPT", scriptSrc)
    .replaceAll("$STYLE", styleSrc)
    .replaceAll("$CSPSOURCE", panel.webview.cspSource);
  return panel;
}

export function deactivate() {}
