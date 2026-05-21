import { useEffect, useMemo, useState } from "react";
import { adminWorkspaceFeaturesService } from "@modules/admin/services/adminWorkspaceFeatures.service";

export function useWorkspaceExternalChatFeature(workspaceId?: string | null) {
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setEnabled(null);
      setError(null);
      return;
    }

    setBusy(true);
    setError(null);
    adminWorkspaceFeaturesService
      .getExternalChatEnabled(workspaceId)
      .then((res: any) => {
        setEnabled(Boolean(res?.data?.workspace?.features?.externalChatApiAccess));
      })
      .catch((e: any) => setError(e?.response?.data?.message || "Failed"))
      .finally(() => setBusy(false));
  }, [workspaceId]);

  const canToggle = useMemo(() => Boolean(workspaceId), [workspaceId]);

  async function toggle(next: boolean) {
    if (!workspaceId) return;
    setBusy(true);
    setError(null);
    try {
      const res: any = await adminWorkspaceFeaturesService.setExternalChatEnabled(workspaceId, next);
      const externalChatApiAccess = Boolean(res?.data?.workspace?.features?.externalChatApiAccess);
      setEnabled(externalChatApiAccess);
      return res;
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  return { busy, enabled, setEnabled, error, canToggle, toggle };
}
