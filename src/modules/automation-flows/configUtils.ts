import type { FlowNodeConfig, KeyValueMap } from "@modules/automation-flows/types";

export function configString(config: FlowNodeConfig, key: string, fallback = "") {
  return typeof config[key] === "string" ? String(config[key]) : fallback;
}

export function configBoolean(config: FlowNodeConfig, key: string) {
  return Boolean(config[key]);
}

export function configNumber(config: FlowNodeConfig, key: string, fallback: number) {
  const value = Number(config[key]);
  return Number.isFinite(value) ? value : fallback;
}

export function configStrings(config: FlowNodeConfig, key: string) {
  return Array.isArray(config[key])
    ? (config[key] as unknown[]).filter((value): value is string => typeof value === "string")
    : [];
}

export function configMap(config: FlowNodeConfig, key: string): KeyValueMap {
  const value = config[key];
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [entryKey, String(entryValue ?? "")])
  );
}
