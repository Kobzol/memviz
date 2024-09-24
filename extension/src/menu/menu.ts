import * as vscode from "vscode";
import { getFileUri, loadStaticFile } from "../resources";
import type { ExtensionToMenuMsg, MenuToExtensionMsg } from "./messages";
import type { Settings } from "./settings";

export class MenuViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "memviz.menuView";

  private view: vscode.WebviewView | null = null;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private settings: Settings,
    private onSettingsUpdate: (settings: Settings) => void,
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, "dist"),
        vscode.Uri.joinPath(this.extensionUri, "static"),
      ],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((data: MenuToExtensionMsg) => {
      if (data.kind === "update-settings") {
        this.onSettingsUpdate(data.settings);
      }
    });
    this.sendMessageToMenu({
      kind: "init-settings",
      settings: this.settings,
    });
  }

  private sendMessageToMenu(message: ExtensionToMenuMsg) {
    if (this.view !== null) {
      this.view.webview.postMessage(message);
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const html = loadStaticFile(this.extensionUri, "menu.html");
    const scriptSrc = getFileUri(webview, this.extensionUri, "menu.js");
    const styleSrc = getFileUri(
      webview,
      this.extensionUri,
      "menu.css",
      "static",
    );
    return html
      .replaceAll("$SCRIPT", scriptSrc)
      .replaceAll("$STYLE", styleSrc)
      .replaceAll("$CSPSOURCE", webview.cspSource);
  }
}
