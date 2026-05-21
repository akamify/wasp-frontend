export type RuntimeEffect = "LIVE" | "CACHE_INVALIDATE" | "RESTART_REQUIRED";
export type ValueType = "string" | "number" | "boolean" | "json" | "secret";

export type PlatformSettingItem = {
  key: string;
  category: string;
  valueType: ValueType;
  masked: boolean;
  value: string | number | boolean | null;
  hasValue: boolean;
  source: "db" | "env" | "default";
  runtimeEffect: RuntimeEffect;
  requiresConfirm: boolean;
  enabled: boolean;
  description: string;
  editableBy: "super_admin";
};

export type PlatformAddonItem = {
  key: string;
  category: string;
  label: string;
  description: string;
  enabled: boolean;
  visibleInFrontend: boolean;
  source: "db" | "default";
  sortOrder: number;
  updatedAt?: string;
};
