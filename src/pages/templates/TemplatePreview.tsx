import { Check, ChevronUp, Copy, ExternalLink, FileText, MessageSquareReply, PhoneCall, Smartphone, Sparkles, Star, Workflow } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatTemplateHtml } from "./helpers";
import { API } from "../../api/api";
import type { CtaButton, HeaderType, TemplateCategory } from "./types";

type Props = {
  category: TemplateCategory;
  headerType: HeaderType;
  headerText: string;
  mediaHandle: string;
  mediaPreviewUrl?: string | null;
  mediaMeta?: { originalName?: string; mimeType?: string; size?: number } | null;
  headerLocation?: { name: string; address: string; latitude: number; longitude: number } | null;
  headerVariableValues?: Record<number, string>;
  bodyText: string;
  footerText: string;
  ctaButtons: CtaButton[];
  variableValues: Record<number, string>;
  authConfig?: {
    otpType: "ZERO_TAP" | "ONE_TAP" | "COPY_CODE";
    expiresInMinutes?: number;
    addSecurityRecommendation?: boolean;
    includeExpirationWarning?: boolean;
  } | null;
};

export function TemplatePreview(props: Props) {
  const { category, headerType, headerText, mediaHandle, mediaPreviewUrl, mediaMeta, headerLocation, headerVariableValues, bodyText, footerText, ctaButtons, variableValues, authConfig } = props;
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fetchedMediaUrl, setFetchedMediaUrl] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const wallpaperUrl = `${import.meta.env.BASE_URL}message-bg.png`;
  const trimmedMediaHandle = mediaHandle.trim();
  const isRemoteMediaUrl = /^https?:\/\//i.test(trimmedMediaHandle);
  const authHtml = useMemo(() => {
    const code = "123456";
    const lines: string[] = [`${code} is your verification code.`];
    if (authConfig?.addSecurityRecommendation !== false) {
      lines.push("For your security, do not share this code.");
    }
    if (
      authConfig?.includeExpirationWarning !== false &&
      typeof authConfig?.expiresInMinutes === "number" &&
      Number.isFinite(authConfig.expiresInMinutes) &&
      authConfig.expiresInMinutes > 0
    ) {
      lines.push(`This code expires in ${Math.round(authConfig.expiresInMinutes)} minutes.`);
    }
    return lines.join("<br/>");
  }, [authConfig]);
  const previewButtons = useMemo(
    () =>
      ctaButtons.filter((button) => {
        if (!button.text.trim()) return false;
        if (button.type === "URL") return !!button.url.trim();
        if (button.type === "PHONE_NUMBER") return !!button.phoneNumber.trim();
        if (button.type === "FLOW") return !!button.flowId.trim();
        if (button.type === "VOICE_CALL") {
          const ttl = Number(button.ttlMinutes);
          return Number.isFinite(ttl) && ttl >= 1440 && ttl <= 43200;
        }
        return true;
      }),
    [ctaButtons]
  );

  const openUrl = (value: string) => {
    const normalized = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;
    if (value.trim()) window.open(normalized, "_blank", "noopener,noreferrer");
  };
  const dialPhone = (value: string) => value.trim() && window.open(`tel:${value.trim().replace(/\s+/g, "")}`, "_self");

  const copyToClipboard = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(String(value || ""));
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1200);
    } catch {}
  };

  const copyMediaHandle = () => void copyToClipboard("media-handle", mediaHandle);

  useEffect(() => {
    const needsFetch =
      category !== "authentication" &&
      (headerType === "IMAGE" || headerType === "VIDEO" || headerType === "DOCUMENT") &&
      !mediaPreviewUrl &&
      !!trimmedMediaHandle &&
      !isRemoteMediaUrl;

    if (!needsFetch) {
      if (fetchedMediaUrl) URL.revokeObjectURL(fetchedMediaUrl);
      setFetchedMediaUrl(null);
      setMediaLoading(false);
      return;
    }

    let alive = true;
    (async () => {
      try {
        setMediaLoading(true);
        const normalizedHandle = trimmedMediaHandle.split(/\s+/).filter(Boolean)[0] || "";
        if (!normalizedHandle) throw new Error("invalid handle");
        const blob = await API.templates.downloadMediaByHandle(normalizedHandle);
        if (!alive) return;
        const url = URL.createObjectURL(blob);
        setFetchedMediaUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setMediaLoading(false);
      } catch {
        if (alive) setMediaLoading(false);
        // ignore: preview will show fallback message + copy handle
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, headerType, mediaPreviewUrl, trimmedMediaHandle, isRemoteMediaUrl]);

  const effectiveMediaUrl = mediaPreviewUrl || fetchedMediaUrl || (isRemoteMediaUrl ? trimmedMediaHandle : null);
  const isPdfDocument =
    headerType === "DOCUMENT" &&
    ((String(mediaMeta?.mimeType || "").toLowerCase().includes("pdf")) ||
      (effectiveMediaUrl ? String(effectiveMediaUrl).toLowerCase().includes(".pdf") : false));

  const MediaSkeleton = () => (
    <div className="h-40 w-full animate-pulse bg-gradient-to-br from-slate-200 to-slate-100" />
  );

  const iconForFlow = (icon: string) => {
    const value = String(icon || "DEFAULT").toUpperCase();
    if (value === "DOCUMENT") return FileText;
    if (value === "PROMOTION") return Sparkles;
    if (value === "REVIEW") return Star;
    return Workflow;
  };

  const formatBytes = (value?: number) => {
    const n = Number(value || 0);
    if (!Number.isFinite(n) || n <= 0) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.round((n / 1024) * 10) / 10} KB`;
    return `${Math.round((n / (1024 * 1024)) * 10) / 10} MB`;
  };

  const documentFileName = useMemo(() => {
    const explicit = String(mediaMeta?.originalName || "").trim();
    if (explicit) return explicit;
    const candidate = effectiveMediaUrl || trimmedMediaHandle;
    if (!candidate) return "Document";
    try {
      const parsed = new URL(candidate);
      const last = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() || "");
      if (last) return last;
    } catch {
      const last = decodeURIComponent(candidate.split("?")[0].split("/").pop() || "");
      if (last) return last;
    }
    return "Document";
  }, [mediaMeta?.originalName, effectiveMediaUrl, trimmedMediaHandle]);

  const documentMetaLine = useMemo(() => {
    const type = String(mediaMeta?.mimeType || "").trim();
    const size = formatBytes(mediaMeta?.size);
    return [type || (isPdfDocument ? "application/pdf" : "document"), size].filter(Boolean).join(" • ");
  }, [mediaMeta?.mimeType, mediaMeta?.size, isPdfDocument]);

  const MediaStatus = ({ label }: { label: string }) => (
    <div className="mt-2 flex items-center justify-between rounded-[5px] border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-600">
      <span className="font-medium">{label}</span>
      <button
        type="button"
        className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-blue-600"
        onClick={copyMediaHandle}
      >
        Copy handle
      </button>
    </div>
  );

  return (
    <div className="sticky top-6 bg-white/80 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-ink-900/55">
        <Smartphone size={14} />
        Template Preview
      </div>
      <div className="mx-auto max-w-[340px] rounded-[36px]">
        <div className="relative min-h-[440px] overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundImage: `url('${wallpaperUrl}')`, backgroundSize: "cover", backgroundRepeat: "no-repeat", backgroundPosition: "center top", filter: "grayscale(0.22) sepia(0.1) hue-rotate(8deg) saturate(0.72)", opacity: 0.8, transform: "scale(1.08)", transformOrigin: "center top" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(243,239,233,0.84) 0%, rgba(236,230,222,0.9) 100%)" }} />
          <div className="relative p-4">
            <div className="relative rounded-xl border border-[#e3dbd2] bg-white/92 p-4 text-[13px] text-[#4b5f82] shadow-[0_8px_18px_rgba(0,0,0,0.09)]">
              <span className="absolute -left-[9px] top-3 h-[18px] w-[12px] border-l border-b border-[#e3dbd2] bg-white/92" style={{ clipPath: "polygon(100% 0, 0 50%, 100% 100%)" }} />
              {category !== "authentication" && headerType === "TEXT" && headerText.trim() ? (
                <div
                  className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6e7f9d]"
                  dangerouslySetInnerHTML={{ __html: formatTemplateHtml(headerText.trim(), headerVariableValues || {}) }}
                />
              ) : null}
              {category !== "authentication" && headerType === "IMAGE" && (effectiveMediaUrl || mediaHandle.trim()) ? (
                <div className="mb-3 overflow-hidden rounded-lg bg-slate-100">
                  {effectiveMediaUrl ? (
                    <img src={effectiveMediaUrl} alt="header" className="h-40 w-full object-cover" />
                  ) : mediaLoading ? (
                    <MediaSkeleton />
                  ) : (
                    <div className="px-3 py-3">
                      <div className="h-40 w-full rounded-md bg-gradient-to-br from-slate-200 to-slate-100" />
                      <MediaStatus label="Image attached, preview unavailable" />
                    </div>
                  )}
                </div>
              ) : null}
              {category !== "authentication" && headerType === "VIDEO" && (effectiveMediaUrl || mediaHandle.trim()) ? (
                <div className="mb-3 overflow-hidden rounded-lg bg-slate-100">
                  {effectiveMediaUrl ? (
                    <video src={effectiveMediaUrl} className="h-40 w-full object-cover" autoPlay playsInline />
                  ) : mediaLoading ? (
                    <MediaSkeleton />
                  ) : (
                    <div className="px-3 py-3">
                      <div className="h-40 w-full rounded-md bg-gradient-to-br from-slate-200 to-slate-100" />
                      <MediaStatus label="Video attached, preview unavailable" />
                    </div>
                  )}
                </div>
              ) : null}
              {category !== "authentication" && headerType === "DOCUMENT" && mediaHandle.trim() ? (
                <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3 text-[12px] text-slate-700">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-semibold text-slate-800">{documentFileName}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">{documentMetaLine || "Document"}</div>
                    </div>
                  </div>
                  {isPdfDocument && effectiveMediaUrl ? (
                    <div className="mt-3 overflow-hidden rounded border border-slate-200">
                      <iframe
                        src={effectiveMediaUrl}
                        title="Document preview"
                        className="h-44 w-full bg-white"
                      />
                    </div>
                  ) : null}
                  <div className="mt-3 flex items-center gap-3 text-[11px]">
                    {effectiveMediaUrl ? (
                      <>
                        <a className="font-semibold text-blue-600 hover:underline" href={effectiveMediaUrl} target="_blank" rel="noreferrer">
                          Open
                        </a>
                        <a className="font-semibold text-slate-600 hover:underline" href={effectiveMediaUrl} target="_blank" rel="noreferrer" download>
                          Download
                        </a>
                      </>
                    ) : mediaLoading ? (
                      <span className="text-slate-500">Loading preview...</span>
                    ) : (
                      <span className="text-slate-500">Preview unavailable.</span>
                    )}
                  </div>
                  {!effectiveMediaUrl && !mediaLoading ? <MediaStatus label="Use handle for delivery mapping" /> : null}
                </div>
              ) : null}
              {category !== "authentication" && headerType === "LOCATION" && headerLocation ? (
                <div className="mb-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <div className="h-20 bg-gradient-to-br from-slate-100 to-slate-200" />
                  <div className="px-3 py-2 text-[12px] text-slate-700">
                    <div className="font-semibold">{headerLocation.name || "Location"}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {headerLocation.address || `${headerLocation.latitude}, ${headerLocation.longitude}`}
                    </div>
                  </div>
                </div>
              ) : category !== "authentication" && headerType === "LOCATION" ? (
                <div className="mb-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <div className="h-20 bg-gradient-to-br from-slate-100 to-slate-200" />
                  <div className="px-3 py-2 text-[12px] text-slate-700">
                    <div className="font-semibold">Location</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">Fill latitude/longitude to preview.</div>
                  </div>
                </div>
              ) : null}
              <div
                className="whitespace-pre-wrap text-[14px] leading-[1.6]"
                dangerouslySetInnerHTML={{
                  __html:
                    category === "authentication"
                      ? authHtml
                      : bodyText.trim()
                        ? formatTemplateHtml(bodyText, variableValues)
                        : "Your message preview appears here...",
                }}
              />
              {category !== "authentication" && footerText.trim() ? <div className="mt-4 text-[11px] text-[#8a97ac]">{footerText.trim()}</div> : null}
              {category === "authentication" ? (
                <button
                  type="button"
                  className="mt-3 flex w-full items-center justify-center gap-2 border-t border-slate-100 pt-2 text-center text-sm font-semibold text-blue-600"
                  onClick={() =>
                    authConfig?.otpType === "COPY_CODE"
                      ? void copyToClipboard("auth-copy", "123456")
                      : null
                  }
                >
                  {authConfig?.otpType === "COPY_CODE" ? (
                    copiedId === "auth-copy" ? <Check size={14} /> : <Copy size={14} />
                  ) : null}
                  {authConfig?.otpType === "ZERO_TAP"
                    ? "Copy code"
                    : authConfig?.otpType === "ONE_TAP"
                      ? "Autofill"
                      : copiedId === "auth-copy"
                        ? "Copied"
                        : "Copy code"}
                </button>
              ) : null}
              {category !== "authentication" && previewButtons.length > 0 ? (
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-100">
                  {previewButtons.slice(0, 3).map((button) => {
                    const FlowIcon = button.type === "FLOW" ? iconForFlow((button as any).flowIcon) : null;
                    return (
                      <button
                        key={button.id}
                        type="button"
                        className="flex w-full items-center justify-center gap-2 border-b border-slate-100 bg-white px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 last:border-b-0"
                        onClick={() =>
                          button.type === "URL"
                            ? openUrl(button.url)
                            : button.type === "PHONE_NUMBER"
                              ? dialPhone(button.phoneNumber)
                              : button.type === "COPY_CODE"
                                ? void copyToClipboard(button.id, button.offerCode || "OFFER_CODE")
                              : null
                        }
                      >
                        {button.type === "URL" ? (
                          <ExternalLink size={14} />
                        ) : button.type === "PHONE_NUMBER" || button.type === "VOICE_CALL" ? (
                          <PhoneCall size={14} />
                        ) : button.type === "COPY_CODE" ? (
                          copiedId === button.id ? <Check size={14} /> : <Copy size={14} />
                        ) : button.type === "FLOW" && FlowIcon ? (
                          <FlowIcon size={14} />
                        ) : button.type === "FLOW" ? (
                          <Workflow size={14} />
                        ) : (
                          <MessageSquareReply size={14} />
                        )}
                        {button.type === "COPY_CODE" && copiedId === button.id ? "Copied" : button.text}
                      </button>
                    );
                  })}

                  {previewButtons.length > 3 ? (
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-2 bg-white px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                      onClick={() => setOptionsOpen(true)}
                    >
                      <ChevronUp size={16} className="rotate-180" /> See all options
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {optionsOpen ? (
            <div className="absolute inset-0 z-20">
              <button
                type="button"
                className="absolute inset-0 bg-black/25"
                onClick={() => setOptionsOpen(false)}
              />
              <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white shadow-[0_-18px_40px_rgba(0,0,0,0.18)]">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-ink-900/55">
                    All options
                  </div>
                  <button
                    type="button"
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-ink-900/70"
                    onClick={() => setOptionsOpen(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto border-t border-slate-100">
                  {previewButtons.map((button) => {
                    const FlowIcon = button.type === "FLOW" ? iconForFlow((button as any).flowIcon) : null;
                    return (
                      <button
                        key={`panel-${button.id}`}
                        type="button"
                        className="flex w-full items-center justify-center gap-2 border-b border-slate-100 bg-white px-3 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 last:border-b-0"
                        onClick={() =>
                          button.type === "URL"
                            ? openUrl(button.url)
                            : button.type === "PHONE_NUMBER"
                              ? dialPhone(button.phoneNumber)
                              : button.type === "COPY_CODE"
                                ? void copyToClipboard(`panel-${button.id}`, button.offerCode || "OFFER_CODE")
                              : null
                        }
                      >
                        {button.type === "URL" ? (
                          <ExternalLink size={14} />
                        ) : button.type === "PHONE_NUMBER" || button.type === "VOICE_CALL" ? (
                          <PhoneCall size={14} />
                        ) : button.type === "COPY_CODE" ? (
                          copiedId === `panel-${button.id}` ? <Check size={14} /> : <Copy size={14} />
                        ) : button.type === "FLOW" && FlowIcon ? (
                          <FlowIcon size={14} />
                        ) : button.type === "FLOW" ? (
                          <Workflow size={14} />
                        ) : (
                          <MessageSquareReply size={14} />
                        )}
                        {button.type === "COPY_CODE" && copiedId === `panel-${button.id}` ? "Copied" : button.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
