import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import type { CtaButton, HeaderType, TemplateCategory } from "@modules/templates/types/templates.types";
import { TemplatePreviewMessage } from "./template-preview/TemplatePreviewMessage";
import { formatBytes } from "./template-preview/helpers";

type Props = {
  category: TemplateCategory; headerType: HeaderType; headerText: string; mediaHandle: string; mediaPreviewUrl?: string | null; mediaMeta?: { originalName?: string; mimeType?: string; size?: number } | null; headerLocation?: { name: string; address: string; latitude: number; longitude: number } | null; headerVariableValues?: Record<number, string>; bodyText: string; footerText: string; ctaButtons: CtaButton[]; variableValues: Record<number, string>; authConfig?: { otpType: "ZERO_TAP" | "ONE_TAP" | "COPY_CODE"; expiresInMinutes?: number; addSecurityRecommendation?: boolean; includeExpirationWarning?: boolean } | null;
};

export function TemplatePreview(props: Props) {
  const { category, headerType, headerText, mediaHandle, mediaPreviewUrl, mediaMeta, headerLocation, headerVariableValues, bodyText, footerText, ctaButtons, variableValues, authConfig } = props;
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fetchedMediaUrl, setFetchedMediaUrl] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const wallpaperUrl = `${import.meta.env.BASE_URL}message-bg.png`;
  const trimmedMediaHandle = String(mediaHandle || "").trim();
  const isRemoteMediaUrl = /^https?:\/\//i.test(trimmedMediaHandle);
  const authLines = useMemo(() => {
    const lines: string[] = ["123456 is your verification code."];
    if (authConfig?.addSecurityRecommendation !== false) lines.push("For your security, do not share this code.");
    if (authConfig?.includeExpirationWarning !== false && typeof authConfig?.expiresInMinutes === "number" && Number.isFinite(authConfig.expiresInMinutes) && authConfig.expiresInMinutes > 0) lines.push(`This code expires in ${Math.round(authConfig.expiresInMinutes)} minutes.`);
    return lines;
  }, [authConfig]);
  const previewButtons = useMemo(() => ctaButtons.filter((button) => {
    const text = String(button?.text || "").trim(); if (!text) return false;
    if (button.type === "URL") return !!String(button.url || "").trim();
    if (button.type === "PHONE_NUMBER") return !!String(button.phoneNumber || "").trim();
    if (button.type === "FLOW") return !!String(button.flowId || "").trim();
    if (button.type === "VOICE_CALL") { const ttl = Number(button.ttlMinutes); return Number.isFinite(ttl) && ttl >= 1440 && ttl <= 43200; }
    return true;
  }), [ctaButtons]);
  const copyToClipboard = async (id: string, value: string) => { try { await navigator.clipboard.writeText(String(value || "")); setCopiedId(id); window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1200); } catch {} };
  const copyMediaHandle = () => void copyToClipboard("media-handle", mediaHandle);

  useEffect(() => {
    const needsFetch = category !== "authentication" && (headerType === "IMAGE" || headerType === "VIDEO" || headerType === "DOCUMENT") && !mediaPreviewUrl && !!trimmedMediaHandle && !isRemoteMediaUrl;
    if (!needsFetch) { if (fetchedMediaUrl) URL.revokeObjectURL(fetchedMediaUrl); setFetchedMediaUrl(null); setMediaLoading(false); return; }
    let alive = true;
    (async () => {
      try { setMediaLoading(true); const normalizedHandle = trimmedMediaHandle.split(/\s+/).filter(Boolean)[0] || ""; if (!normalizedHandle) throw new Error("invalid handle"); const blob = await API.templates.downloadMediaByHandle(normalizedHandle); if (!alive) return; const url = URL.createObjectURL(blob); setFetchedMediaUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; }); setMediaLoading(false); } catch { if (alive) setMediaLoading(false); }
    })();
    return () => { alive = false; };
  }, [category, headerType, mediaPreviewUrl, trimmedMediaHandle, isRemoteMediaUrl]);

  const effectiveMediaUrl = mediaPreviewUrl || fetchedMediaUrl || (isRemoteMediaUrl ? trimmedMediaHandle : null);
  const isPdfDocument = headerType === "DOCUMENT" && ((String(mediaMeta?.mimeType || "").toLowerCase().includes("pdf")) || (effectiveMediaUrl ? String(effectiveMediaUrl).toLowerCase().includes(".pdf") : false));
  const documentFileName = useMemo(() => { const explicit = String(mediaMeta?.originalName || "").trim(); if (explicit) return explicit; const candidate = effectiveMediaUrl || trimmedMediaHandle; if (!candidate) return "Document"; try { const parsed = new URL(candidate); const last = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() || ""); if (last) return last; } catch { const last = decodeURIComponent(candidate.split("?")[0].split("/").pop() || ""); if (last) return last; } return "Document"; }, [mediaMeta?.originalName, effectiveMediaUrl, trimmedMediaHandle]);
  const documentMetaLine = useMemo(() => [String(mediaMeta?.mimeType || "").trim() || (isPdfDocument ? "application/pdf" : "document"), formatBytes(mediaMeta?.size)].filter(Boolean).join(" • "), [mediaMeta?.mimeType, mediaMeta?.size, isPdfDocument]);

  return <TemplatePreviewMessage wallpaperUrl={wallpaperUrl} category={category} headerType={headerType} headerText={headerText} headerVariableValues={headerVariableValues} effectiveMediaUrl={effectiveMediaUrl} mediaHandle={mediaHandle} mediaLoading={mediaLoading} documentFileName={documentFileName} documentMetaLine={documentMetaLine} isPdfDocument={isPdfDocument} headerLocation={headerLocation} authLines={authLines} bodyText={bodyText} variableValues={variableValues} footerText={footerText} authConfig={authConfig} copiedId={copiedId} copyMediaHandle={copyMediaHandle} copyToClipboard={copyToClipboard} previewButtons={previewButtons} optionsOpen={optionsOpen} setOptionsOpen={setOptionsOpen} />;
}
