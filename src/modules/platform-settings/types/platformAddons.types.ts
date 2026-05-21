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
