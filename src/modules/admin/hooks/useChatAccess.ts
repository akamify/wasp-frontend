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

  async function enableChat(userId: string) {
    setBusy(true);
    try {
      return await adminChatAccessService.enable(userId);
    } finally {
      setBusy(false);
    }
  }

  async function disableChat(userId: string) {
    setBusy(true);
    try {
      return await adminChatAccessService.disable(userId);
    } finally {
      setBusy(false);
    }
  }

  async function enableCampaignSend(userId: string) {
    setBusy(true);
    try {
      return await adminChatAccessService.enableCampaignSend(userId);
    } finally {
      setBusy(false);
    }
  }

  async function disableCampaignSend(userId: string) {
    setBusy(true);
    try {
      return await adminChatAccessService.disableCampaignSend(userId);
    } finally {
      setBusy(false);
    }
  }

  return { busy, sendOtp, verifyOtp, enableChat, disableChat, enableCampaignSend, disableCampaignSend };
}
