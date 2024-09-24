import type * as vscode from "vscode";
import type { Settings } from "./settings";

export function loadSettings(context: vscode.ExtensionContext): Settings {
  return { enabled: loadSettingItem(context, IS_ENABLED_KEY, true) };
}

const IS_ENABLED_KEY = "memviz.settings";

function loadSettingItem<T>(
  context: vscode.ExtensionContext,
  key: string,
  defaultValue: T,
): T {
  const data = context.workspaceState.get<T>(key);
  return data ?? defaultValue;
}
