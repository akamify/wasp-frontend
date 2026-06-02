import { api } from "@api/api";

export const adminChatAccessService = {
  sendOtp: (userId: string) => api.post(`/admin/users/${userId}/chat-access/send-otp`),
  verifyOtp: (userId: string, otp: string) => api.post(`/admin/users/${userId}/chat-access/verify-otp`, { otp }),
  enable: (workspaceId: string) => api.patch(`/admin/workspaces/${workspaceId}/chat-access/enable`),
  disable: (workspaceId: string) => api.patch(`/admin/workspaces/${workspaceId}/chat-access/disable`),
  enableCampaignSend: (workspaceId: string) => api.patch(`/admin/workspaces/${workspaceId}/api-permissions/campaign-send/enable`),
  disableCampaignSend: (workspaceId: string) => api.patch(`/admin/workspaces/${workspaceId}/api-permissions/campaign-send/disable`),
  blockUser: (userId: string) => api.patch(`/admin/users/${userId}/block`),
  unblockUser: (userId: string) => api.patch(`/admin/users/${userId}/unblock`),
};
