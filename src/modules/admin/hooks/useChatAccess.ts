import { useState } from "react";
import { adminChatAccessService } from "@modules/admin/services/adminChatAccess.service";

export function useChatAccess() {
  const [busy, setBusy] = useState(false);

  async function sendOtp(userId: string) {
    setBusy(true);
    try {
      return await adminChatAccessService.sendOtp(userId);
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(userId: string, otp: string) {
    setBusy(true);
    try {
      return await adminChatAccessService.verifyOtp(userId, otp);
    } finally {
      setBusy(false);
    }
  }

  async function enableChat(workspaceId: string) {
    setBusy(true);
    try {
      return await adminChatAccessService.enable(workspaceId);
    } finally {
      setBusy(false);
    }
  }

  async function disableChat(workspaceId: string) {
    setBusy(true);
    try {
      return await adminChatAccessService.disable(workspaceId);
    } finally {
      setBusy(false);
    }
  }

  async function enableCampaignSend(workspaceId: string) {
    setBusy(true);
    try {
      return await adminChatAccessService.enableCampaignSend(workspaceId);
    } finally {
      setBusy(false);
    }
  }

  async function disableCampaignSend(workspaceId: string) {
    setBusy(true);
    try {
      return await adminChatAccessService.disableCampaignSend(workspaceId);
    } finally {
      setBusy(false);
    }
  }

  return { busy, sendOtp, verifyOtp, enableChat, disableChat, enableCampaignSend, disableCampaignSend };
}
