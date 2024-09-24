import type {
  ExtensionToMenuMsg,
  MenuToExtensionMsg,
} from "../src/menu/messages";
import type { Settings } from "../src/menu/settings";

const vscode = acquireVsCodeApi();

const state = vscode.getState();
if (state !== undefined) {
  initUiWithSettings(state as Settings);
}

window.addEventListener(
  "message",
  (event: MessageEvent<ExtensionToMenuMsg>) => {
    if (event.data.kind === "init-settings") {
      const settings = event.data.settings;
      vscode.setState(settings);
      initUiWithSettings(settings);
    }
  },
);

function getEnabledCheckbox(): HTMLInputElement {
  return document.getElementById("enabled") as HTMLInputElement;
}

function initUiWithSettings(settings: Settings) {
  const enabledCheckbox = getEnabledCheckbox();
  enabledCheckbox.checked = settings.enabled;
  enabledCheckbox.addEventListener("change", () => sendSettings());

  document.getElementById("menu")?.classList.remove("hidden");
}

function getSettingsFromUi(): Settings {
  const enabled = getEnabledCheckbox().checked;
  return {
    enabled,
  };
}

function sendSettings() {
  const settings = getSettingsFromUi();
  const message: MenuToExtensionMsg = {
    kind: "update-settings",
    settings,
  };
  vscode.postMessage(message);
  vscode.setState(settings);
}
