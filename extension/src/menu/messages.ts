import type { Settings } from "./settings";

interface InitMenuMsg {
  kind: "init-settings";
  settings: Settings;
}

export type ExtensionToMenuMsg = InitMenuMsg;

interface UpdateMenuMsg {
  kind: "update-settings";
  settings: Settings;
}

export type MenuToExtensionMsg = UpdateMenuMsg;
