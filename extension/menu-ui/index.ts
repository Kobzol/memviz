import type {
  ExtensionToMenuMsg,
  MenuToExtensionMsg,
} from "../src/menu/messages";
import type { Settings } from "../src/menu/settings";

const vscode = acquireVsCodeApi();
let listenersConfigured = false;

const state = vscode.getState();
if (state !== undefined) {
  updateUiWithSettings(state as Settings);
}

window.addEventListener(
  "message",
  (event: MessageEvent<ExtensionToMenuMsg>) => {
    if (event.data.kind === "init-settings") {
      const settings = event.data.settings;
      vscode.setState(settings);
      updateUiWithSettings(settings);
    }
  },
);

function getEnabledCheckbox(): HTMLInputElement {
  return document.getElementById("enabled") as HTMLInputElement;
}
function getDynAllocTrackingCheckbox(): HTMLInputElement {
  return document.getElementById("dynalloc-tracking") as HTMLInputElement;
}

function updateUiWithSettings(settings: Settings) {
  function configureCheckbox(
    checkbox: HTMLInputElement,
    value: boolean,
  ): HTMLInputElement {
    checkbox.checked = value;
    if (!listenersConfigured) {
      checkbox.addEventListener("change", () => sendSettings());
    }
    return checkbox;
  }

  configureCheckbox(getEnabledCheckbox(), settings.enabled);
  const dynTrackingCheckbox = configureCheckbox(
    getDynAllocTrackingCheckbox(),
    settings.trackDynamicAllocations,
  );
  dynTrackingCheckbox.disabled = !settings.enabled;

  listenersConfigured = true;
  document.getElementById("menu")?.classList.remove("hidden");
}

function getSettingsFromUi(): Settings {
  const enabled = getEnabledCheckbox().checked;
  const dynAllocTracking = getDynAllocTrackingCheckbox().checked;
  return {
    enabled,
    trackDynamicAllocations: dynAllocTracking,
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
  updateUiWithSettings(settings);
}
