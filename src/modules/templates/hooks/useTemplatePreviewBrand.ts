import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { useAuth } from "@shared/providers/AuthContext";
import { whatsappProfilePictureUrl } from "@shared/utils/whatsappProfile";

export type TemplatePreviewBrand = {
  title: string;
  subtitle: string;
  avatarUrl: string;
  initial: string;
  statusLabel: string;
};

function initialFrom(value?: string | null) {
  const raw = String(value || "").trim();
  return raw ? raw.charAt(0).toUpperCase() : "W";
}

function subtitleFromPhone(value?: string | null) {
  const raw = String(value || "").trim();
  return raw || "WhatsApp template message";
}

function statusLabelFrom(value?: string | null) {
  const status = String(value || "").trim().toLowerCase();
  if (status === "active") return "Verified";
  if (status === "pending") return "Pending";
  if (status === "disconnected") return "Offline";
  return "Preview";
}

export function useTemplatePreviewBrand() {
  const { workspace } = useAuth();
  const workspaceName = String(workspace?.name || "").trim();
  const [metaBrand, setMetaBrand] = useState<Partial<TemplatePreviewBrand> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const response: any = await API.meta.status();
        if (!alive) return;
        const businessProfile = response?.businessProfile || response?.connection?.businessProfile || null;
        const phone = response?.phone || response?.connection?.phone || null;
        const avatarUrl = whatsappProfilePictureUrl(businessProfile);
        const title = String(
          phone?.verified_name ||
          response?.verifiedName ||
          response?.connection?.verifiedName ||
          workspaceName ||
          "WhatsApp Business"
        ).trim();
        const subtitle = subtitleFromPhone(
          phone?.display_phone_number ||
          response?.displayPhoneNumber ||
          response?.connection?.displayPhoneNumber
        );
        const statusLabel = statusLabelFrom(response?.status || response?.connection?.connectionStatus);
        setMetaBrand({
          title,
          subtitle,
          avatarUrl,
          initial: initialFrom(title),
          statusLabel,
        });
      } catch {
        if (!alive) return;
        setMetaBrand(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [workspaceName]);

  return useMemo<TemplatePreviewBrand>(() => {
    const fallbackTitle = workspaceName || "WhatsApp Business";
    return {
      title: String(metaBrand?.title || fallbackTitle).trim() || "WhatsApp Business",
      subtitle: String(metaBrand?.subtitle || workspaceName || "WhatsApp template message").trim() || "WhatsApp template message",
      avatarUrl: String(metaBrand?.avatarUrl || "").trim(),
      initial: initialFrom(metaBrand?.title || fallbackTitle),
      statusLabel: String(metaBrand?.statusLabel || (workspaceName ? "Workspace" : "Preview")).trim() || "Preview",
    };
  }, [metaBrand, workspaceName]);
}
