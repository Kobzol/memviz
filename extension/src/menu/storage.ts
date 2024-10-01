import type * as vscode from "vscode";
import type { Settings } from "./settings";

export function loadSettings(context: vscode.ExtensionContext): Settings {
  return {
    enabled: loadSettingItem(context, IS_ENABLED_KEY, true),
    trackDynamicAllocations: loadSettingItem(
      context,
      TRACK_DYNAMIC_ALLOCATIONS_KEY,
      true,
    ),
  };
}

export function saveSettings(
  context: vscode.ExtensionContext,
  settings: Settings,
) {
  console.log("Saving settings", settings);
  saveSettingItem(context, IS_ENABLED_KEY, settings.enabled);
  saveSettingItem(
    context,
    TRACK_DYNAMIC_ALLOCATIONS_KEY,
    settings.trackDynamicAllocations,
  );
}

/*
Denylisted keys:
- memviz.settings (named wrongly in <=0.2.0)
*/
const IS_ENABLED_KEY = "memviz.settings.enabled";
const TRACK_DYNAMIC_ALLOCATIONS_KEY =
  "memviz.settings.track-dynamic-allocations";

function loadSettingItem<T>(
  context: vscode.ExtensionContext,
  key: string,
  defaultValue: T,
): T {
  const data = context.workspaceState.get<T>(key);
  return data ?? defaultValue;
}

function saveSettingItem<T>(
  context: vscode.ExtensionContext,
  key: string,
  value: T,
) {
  context.workspaceState.update(key, value);
}
