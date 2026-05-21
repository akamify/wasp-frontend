import { API } from "@api/api";

export const platformAddonsService = {
  listAll: () => API.superAdmin.platformAddons(),
  listByCategory: (category: string) => API.superAdmin.platformAddonsByCategory(category),
  updateOne: (key: string, enabled: boolean) => API.superAdmin.updatePlatformAddon(key, { enabled }),
  bulkUpdate: (updates: Array<{ key: string; enabled: boolean }>) => API.superAdmin.bulkUpdatePlatformAddons({ updates }),
};
