import { API } from "@api/api";

export const adminChatAccessService = {
  sendOtp: (userId: string) => API.admin.sendChatAccessOtp(userId),
  verifyOtp: (userId: string, otp: string) => API.admin.verifyChatAccessOtp(userId, { otp }),
  enable: (userId: string) => API.admin.enableChatAccess(userId),
  disable: (userId: string) => API.admin.disableChatAccess(userId),
  enableCampaignSend: (userId: string) => API.admin.enableCampaignSendAccess(userId),
  disableCampaignSend: (userId: string) => API.admin.disableCampaignSendAccess(userId),
  blockUser: (userId: string) => API.admin.blockUser(userId),
  unblockUser: (userId: string) => API.admin.unblockUser(userId),
};
