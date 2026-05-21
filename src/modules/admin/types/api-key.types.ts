export type ApiKeyPermissions = {
  campaignSend: boolean;
  chatAccess: boolean;
};

export type UserApiKey = {
  id: string;
  name: string;
  permissions: ApiKeyPermissions;
  revoked: boolean;
  revokedAt: string | null;
  createdAt: string | null;
  lastUsedAt: string | null;
};

export type UserApiKeyListResponse = {
  success: boolean;
  accountBlocked: boolean;
  allowedApiPermissions: ApiKeyPermissions;
  apiKeys: UserApiKey[];
};
