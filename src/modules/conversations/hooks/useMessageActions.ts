import { useCallback, useEffect, useState } from "react";
import { API } from "@api/api";
import type { ChatMessage } from "@modules/conversations/types/conversations.types";

export function getErrorMessage(error: any): string {
  if (!error) return "Send failed";
  if (typeof error === "string") return error;
  if (Array.isArray(error)) return getErrorMessage(error[0]);
  return (
    error?.providerError ||
    error?.message ||
    error?.metaDebug?.meta?.error_user_msg ||
    error?.metaDebug?.meta?.message ||
    error?.error_data?.details ||
    "Send failed"
  );
}

export function useMessageActions(messages: ChatMessage[]) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [mediaLoading, setMediaLoading] = useState<Record<string, true>>({});
  const [mediaErrors, setMediaErrors] = useState<Record<string, string>>({});

  const ensureMediaUrl = useCallback(async (id: string) => {
    const key = String(id || "").trim();
    if (!key || mediaUrls[key] || mediaLoading[key]) return;
    setMediaLoading((prev) => ({ ...prev, [key]: true }));
    setMediaErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    try {
      const blob = await API.messages.downloadMedia(key);
      const url = URL.createObjectURL(blob);
      setMediaUrls((prev) => ({ ...prev, [key]: url }));
    } catch (e: any) {
      setMediaErrors((prev) => ({ ...prev, [key]: e?.response?.data?.message || e?.message || "Failed to load media" }));
    } finally {
      setMediaLoading((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, [mediaLoading, mediaUrls]);

  useEffect(() => {
    const ids = collectMediaIds(messages);
    const toFetch = Array.from(ids).filter((id) => id && !mediaUrls[id] && !mediaLoading[id]);
    if (!toFetch.length) return;
    toFetch.slice(0, 3).forEach((id) => void ensureMediaUrl(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    return () => {
      Object.values(mediaUrls).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore revoke errors
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ensureMediaUrl, mediaErrors, mediaLoading, mediaUrls, selectedImage, setSelectedImage };
}

function collectMediaIds(messages: ChatMessage[]) {
  const ids = new Set<string>();
  for (const message of messages) {
    const payload = (message as any)?.payload || {};
    [payload?.image?.id, payload?.video?.id, payload?.audio?.id, payload?.document?.id].filter(Boolean).forEach((id) => ids.add(String(id)));
    const components = Array.isArray(payload?.components) ? payload.components : [];
    for (const component of components) {
      if (String(component?.type || "").toLowerCase() !== "header") continue;
      const firstParam = Array.isArray(component?.parameters) ? component.parameters[0] : null;
      const type = String(firstParam?.type || "").toLowerCase();
      if (type === "image" && firstParam?.image?.id) ids.add(String(firstParam.image.id));
      if (type === "video" && firstParam?.video?.id) ids.add(String(firstParam.video.id));
      if (type === "audio" && firstParam?.audio?.id) ids.add(String(firstParam.audio.id));
      if (type === "document" && firstParam?.document?.id) ids.add(String(firstParam.document.id));
    }
  }
  return ids;
}

