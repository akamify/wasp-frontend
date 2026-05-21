import { useState } from "react";
import { adminApiKeysService } from "@modules/admin/services/adminApiKeys.service";

export function useApiKeyActions() {
  const [busy, setBusy] = useState(false);

  async function disableKey(userId: string, keyId: string) {
    setBusy(true);
    try {
      return await adminApiKeysService.disableKey(userId, keyId);
    } finally {
      setBusy(false);
    }
  }

  async function enableKey(userId: string, keyId: string) {
    setBusy(true);
    try {
      return await adminApiKeysService.enableKey(userId, keyId);
    } finally {
      setBusy(false);
    }
  }

  async function setChatAccess(userId: string, keyId: string, enabled: boolean) {
    setBusy(true);
    try {
      return await adminApiKeysService.setChatAccess(userId, keyId, enabled);
    } finally {
      setBusy(false);
    }
  }

  async function syncChatAccess(userId: string, enabled: boolean) {
    setBusy(true);
    try {
      return await adminApiKeysService.syncChatAccess(userId, enabled);
    } finally {
      setBusy(false);
    }
  }

  return { busy, disableKey, enableKey, setChatAccess, syncChatAccess };
}
