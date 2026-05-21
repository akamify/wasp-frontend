import type { RuntimeEffect } from "@modules/platform-settings/types/platformSettings.types";

export function sourceBadgeClass(source: string): string {
  if (source === "db") return "bg-emerald-100 text-emerald-700";
  if (source === "env") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export function runtimeEffectLabel(effect: RuntimeEffect): string {
  if (effect === "RESTART_REQUIRED") return "Restart Required";
  if (effect === "CACHE_INVALIDATE") return "Cache Invalidate";
  return "Live";
}

export function settingInputValue(value: string | number | boolean | null): string {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}
