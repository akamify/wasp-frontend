import { API } from "@api/api";

export type BuilderPanel = "flow_settings" | "node_settings";
export type BuilderLeftTab = "messages" | "actions";

export interface AutomationBuilderPreferences {
  leftSidebarCollapsed: boolean;
  rightSettingsOpen: boolean;
  leftSidebarWidth: number;
  rightSettingsWidth: number;
  lastActivePanel: BuilderPanel;
  lastActiveLeftTab: BuilderLeftTab;
}

export const DEFAULT_AUTOMATION_BUILDER_PREFERENCES: AutomationBuilderPreferences = {
  leftSidebarCollapsed: false,
  rightSettingsOpen: true,
  leftSidebarWidth: 280,
  rightSettingsWidth: 360,
  lastActivePanel: "flow_settings",
  lastActiveLeftTab: "messages",
};

function normalize(value: unknown): AutomationBuilderPreferences {
  const source =
    value && typeof value === "object"
      ? (value as Partial<AutomationBuilderPreferences>)
      : {};
  return {
    ...DEFAULT_AUTOMATION_BUILDER_PREFERENCES,
    ...source,
  };
}

export async function getAutomationBuilderPreferences() {
  const response = (await API.preferences.automationBuilder()) as {
    preferences?: unknown;
  };
  return normalize(response?.preferences);
}

export async function updateAutomationBuilderPreferences(
  update: Partial<AutomationBuilderPreferences>
) {
  const response = (await API.preferences.updateAutomationBuilder(update)) as {
    preferences?: unknown;
  };
  return normalize(response?.preferences);
}
