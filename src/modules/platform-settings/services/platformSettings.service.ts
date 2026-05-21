import { API } from "@api/api";

export const platformSettingsService = {
  listAll: () => API.superAdmin.platformSettings(),
  listByCategory: (category: string) => API.superAdmin.platformSettingsByCategory(category),
  updateOne: (key: string, payload: { value: unknown; confirmReplaceSecret?: boolean }) =>
    API.superAdmin.updatePlatformSetting(key, payload),
  bulkUpdate: (updates: Array<{ key: string; value: unknown; confirmReplaceSecret?: boolean }>) =>
    API.superAdmin.bulkUpdatePlatformSettings({ updates }),
  testEmail: (toEmail: string) => API.superAdmin.testPlatformCategory("email", { toEmail }),
  testMeta: () => API.superAdmin.testPlatformCategory("meta", {}),
  testRazorpay: () => API.superAdmin.testPlatformCategory("razorpay", {}),
};
