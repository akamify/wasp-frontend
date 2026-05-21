import { API } from "@api/api";

export const adminWorkspaceFeaturesService = {
  getExternalChatEnabled: (workspaceId: string) => API.admin.getWorkspaceExternalChatFeature(workspaceId),
  setExternalChatEnabled: (workspaceId: string, enabled: boolean) =>
    API.admin.setWorkspaceExternalChatFeature(workspaceId, enabled),
};
