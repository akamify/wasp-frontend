import { API } from "@api/api";
import type { UserApiKeyListResponse } from "@modules/admin/types/api-key.types";

export const adminApiKeysService = {
  listForCurrentUser: () => API.auth.apiKeyStatus(),
  listForUser: async (userId: string): Promise<UserApiKeyListResponse> =>
    API.admin.userApiKeys(userId),
  generate: (name?: string) => API.auth.generateApiKey({ name }),
  regenerate: (keyId?: string, name?: string) => API.auth.regenerateApiKey({ keyId, name }),
  disableKey: (userId: string, keyId: string) => API.admin.disableUserApiKey(userId, keyId),
  enableKey: (userId: string, keyId: string) => API.admin.enableUserApiKey(userId, keyId),
  setChatAccess: (userId: string, keyId: string, enabled: boolean) => API.admin.setApiKeyChatAccess(userId, keyId, enabled),
  syncChatAccess: (userId: string, enabled: boolean) => API.admin.syncApiKeysChatAccess(userId, enabled),
};
