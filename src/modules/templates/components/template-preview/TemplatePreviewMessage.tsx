import { Copy, FileText, Smartphone, Workflow } from "lucide-react";
import {
  MediaSkeleton,
  MediaStatus,
  copyButtonIcon,
  dialPhone,
  ExternalLink,
  iconForFlow,
  MenuIcon,
  MessageSquareReply,
  openUrl,
  PhoneCall,
  renderTemplateText,
} from "./helpers";

export function TemplatePreviewMessage(props: any) {
  const {
    wallpaperUrl,
    category,
    headerType,
    headerText,
    headerVariableValues,
    effectiveMediaUrl,
    mediaHandle,
    mediaLoading,
    documentFileName,
    documentMetaLine,
    isPdfDocument,
    headerLocation,
    authLines,
    bodyText,
    variableValues,
    footerText,
    authConfig,
    copiedId,
    copyMediaHandle,
    copyToClipboard,
    previewButtons,
    optionsOpen,
    setOptionsOpen,
    previewBrand,
  } = props;

  const previewTitle =
    String(previewBrand?.title || "AIWizChat Preview").trim() ||
    "AIWizChat Preview";

  const previewSubtitle =
    String(previewBrand?.subtitle || "WhatsApp template message").trim() ||
    "WhatsApp template message";

  const previewAvatarUrl = String(previewBrand?.avatarUrl || "").trim();

  const previewInitial =
    String(previewBrand?.initial || previewTitle.charAt(0) || "W").trim() ||
    "W";

  const previewStatusLabel =
    String(previewBrand?.statusLabel || "Preview").trim() || "Preview";

  return (
    <div className="sticky bg-white/80">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-ink-900/55">
        <Smartphone size={14} />
        WhatsApp Preview
      </div>
      <div className="mx-auto max-w-[360px] min-w-[320px]">
        <div className="rounded-[42px] bg-[linear-gradient(160deg,#0f172a_0%,#1e293b_45%,#334155_100%)] p-[10px] shadow-[0_30px_60px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/10">
          <div className="relative overflow-hidden rounded-[34px] border border-slate-800/50 bg-[#111827]">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center">
              <div className="mt-2 h-6 w-32 rounded-full bg-black/85 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]" />
            </div>
            <div className="relative h-[620px] overflow-hidden bg-[#ece5dd]">
              <div className="relative z-10 flex items-center justify-between bg-[#0b141a] px-5 pb-3 pt-10 text-white">
                <div className="flex items-center gap-3">
                  {previewAvatarUrl ? (
                    <div className="h-9 w-9 overflow-hidden rounded-full border border-white/10 bg-emerald-500/15">
                      <img
                        src={previewAvatarUrl}
                        alt={previewTitle}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-[13px] font-black text-emerald-200">
                      {previewInitial}
                    </div>
                  )}
                  <div>
                    <div className="max-w-[180px] truncate text-sm font-black tracking-tight">
                      {previewTitle}
                    </div>
                    <div className="max-w-[180px] truncate text-[11px] font-medium text-slate-300">
                      {previewSubtitle}
                    </div>
                  </div>
                </div>
                <div className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
                  {previewStatusLabel}
                </div>
              </div>
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url('${wallpaperUrl}')`,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center top",
                  filter:
                    "grayscale(0.22) sepia(0.1) hue-rotate(8deg) saturate(0.72)",
                  opacity: 0.8,
                  transform: "scale(1.08)",
                  transformOrigin: "center top",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(243,239,233,0.82) 0%, rgba(236,230,222,0.92) 100%)",
                }}
              />
              <div className="relative z-10 h-[calc(100%-76px)] overflow-y-auto px-4 pb-10 pt-5 scrollbar-none">
                <div className="mb-3 flex justify-end">
                  <div className="rounded-full bg-white/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 shadow-sm">
                    Template message
                  </div>
                </div>
                <div className="relative rounded-[18px] rounded-tl-[6px] border border-[#e3dbd2] bg-white/92 p-4 text-[13px] text-[#4b5f82] shadow-[0_8px_18px_rgba(0,0,0,0.09)]">
                  <span
                    className="absolute -left-[9px] top-3 h-[18px] w-[12px] border-l border-b border-[#e3dbd2] bg-white/92"
                    style={{ clipPath: "polygon(100% 0, 0 50%, 100% 100%)" }}
                  />
                  {category !== "authentication" &&
                  headerType === "TEXT" &&
                  headerText.trim() ? (
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6e7f9d]">
                      {renderTemplateText(
                        headerText.trim(),
                        headerVariableValues || {},
                      )}
                    </div>
                  ) : null}
                  {category !== "authentication" &&
                  headerType === "IMAGE" &&
                  (effectiveMediaUrl || mediaHandle.trim()) ? (
                    <div className="mb-3 overflow-hidden rounded-[5px] bg-slate-100">
                      {effectiveMediaUrl ? (
                        <img
                          src={effectiveMediaUrl}
                          alt="header"
                          className="h-40 w-full object-cover"
                        />
                      ) : mediaLoading ? (
                        <MediaSkeleton />
                      ) : (
                        <div className="px-3 py-3">
                          <div className="h-40 w-full rounded-[5px] bg-gradient-to-br from-slate-200 to-slate-100" />
                          <MediaStatus
                            label="Image attached, preview unavailable"
                            onCopy={copyMediaHandle}
                          />
                        </div>
                      )}
                    </div>
                  ) : null}
                  {category !== "authentication" &&
                  headerType === "VIDEO" &&
                  (effectiveMediaUrl || mediaHandle.trim()) ? (
                    <div className="mb-3 overflow-hidden rounded-[5px] bg-slate-100">
                      {effectiveMediaUrl ? (
                        <video
                          src={effectiveMediaUrl}
                          className="h-40 w-full object-cover"
                          autoPlay
                          playsInline
                        />
                      ) : mediaLoading ? (
                        <MediaSkeleton />
                      ) : (
                        <div className="px-3 py-3">
                          <div className="h-40 w-full rounded-[5px] bg-gradient-to-br from-slate-200 to-slate-100" />
                          <MediaStatus
                            label="Video attached, preview unavailable"
                            onCopy={copyMediaHandle}
                          />
                        </div>
                      )}
                    </div>
                  ) : null}
                  {category !== "authentication" &&
                  headerType === "DOCUMENT" &&
                  mediaHandle.trim() ? (
                    <div className="mb-3 rounded-[5px] border border-slate-200 bg-white p-3 text-[12px] text-slate-700">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[5px] bg-slate-100 text-slate-600">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12px] font-semibold text-slate-800">
                            {documentFileName}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            {documentMetaLine || "Document"}
                          </div>
                        </div>
                      </div>
                      {isPdfDocument && effectiveMediaUrl ? (
                        <div className="mt-3 overflow-hidden rounded-[5px] border border-slate-200">
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
                            <a
                              className="font-semibold text-blue-600 hover:underline"
                              href={effectiveMediaUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open
                            </a>
                            <a
                              className="font-semibold text-slate-600 hover:underline"
                              href={effectiveMediaUrl}
                              target="_blank"
                              rel="noreferrer"
                              download
                            >
                              Download
                            </a>
                          </>
                        ) : mediaLoading ? (
                          <span className="text-slate-500">
                            Loading preview...
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            Preview unavailable.
                          </span>
                        )}
                      </div>
                      {!effectiveMediaUrl && !mediaLoading ? (
                        <MediaStatus
                          label="Use handle for delivery mapping"
                          onCopy={copyMediaHandle}
                        />
                      ) : null}
                    </div>
                  ) : null}
                  {category !== "authentication" &&
                  headerType === "LOCATION" ? (
                    <div className="mb-3 overflow-hidden rounded-[5px] border border-slate-200 bg-white">
                      <div className="h-20 bg-gradient-to-br from-slate-100 to-slate-200" />
                      <div className="px-3 py-2 text-[12px] text-slate-700">
                        <div className="font-semibold">
                          {headerLocation?.name || "Location"}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          {headerLocation
                            ? headerLocation.address ||
                              `${headerLocation.latitude}, ${headerLocation.longitude}`
                            : "Fill latitude/longitude to preview."}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <div className="whitespace-pre-wrap text-[14px] leading-[1.6]">
                    {category === "authentication"
                      ? authLines.map((line: string, idx: number) => (
                          <span key={idx}>
                            {line}
                            {idx < authLines.length - 1 ? <br /> : null}
                          </span>
                        ))
                      : bodyText.trim()
                        ? renderTemplateText(bodyText, variableValues)
                        : "Your message preview appears here..."}
                  </div>
                  {category !== "authentication" && footerText.trim() ? (
                    <div className="mt-4 text-[11px] text-[#8a97ac]">
                      {footerText.trim()}
                    </div>
                  ) : null}
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
                      {authConfig?.otpType === "COPY_CODE"
                        ? copyButtonIcon(copiedId === "auth-copy")
                        : null}
                      {authConfig?.otpType === "ZERO_TAP"
                        ? "Copy code"
                        : authConfig?.otpType === "ONE_TAP"
                          ? "Autofill"
                          : copiedId === "auth-copy"
                            ? "Copied"
                            : "Copy code"}
                    </button>
                  ) : null}
                  {category !== "authentication" &&
                  previewButtons.length > 0 ? (
                    <div className="mt-3 overflow-hidden rounded-[5px] border border-slate-100">
                      {previewButtons.slice(0, 3).map((button: any) => {
                        const FlowIcon =
                          button.type === "FLOW"
                            ? iconForFlow((button as any).flowIcon)
                            : null;
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
                                    ? void copyToClipboard(
                                        button.id,
                                        button.offerCode || "OFFER_CODE",
                                      )
                                    : null
                            }
                          >
                            {button.type === "URL" ? (
                              <ExternalLink size={14} />
                            ) : button.type === "PHONE_NUMBER" ||
                              button.type === "VOICE_CALL" ? (
                              <PhoneCall size={14} />
                            ) : button.type === "COPY_CODE" ? (
                              copyButtonIcon(copiedId === button.id)
                            ) : button.type === "FLOW" && FlowIcon ? (
                              <FlowIcon size={14} />
                            ) : button.type === "FLOW" ? (
                              <Workflow size={14} />
                            ) : (
                              <MessageSquareReply size={14} />
                            )}
                            {button.type === "COPY_CODE" &&
                            copiedId === button.id
                              ? "Copied"
                              : button.text}
                          </button>
                        );
                      })}
                      {previewButtons.length > 3 ? (
                        <button
                          type="button"
                          className="flex w-full items-center justify-center gap-2 bg-white px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                          onClick={() => setOptionsOpen(true)}
                        >
                          <MenuIcon size={16} className="rotate-180" /> See all
                          options
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center pb-2">
                <div className="h-1.5 w-28 rounded-full bg-slate-900/20" />
              </div>
              {optionsOpen ? (
                <div className="absolute inset-0 z-20">
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/25"
                    onClick={() => setOptionsOpen(false)}
                  />
                  <div className="absolute inset-x-0 bottom-0 rounded-t-[24px] bg-white shadow-[0_-18px_40px_rgba(0,0,0,0.18)]">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="text-xs font-black uppercase tracking-[0.2em] text-ink-900/55">
                        All options
                      </div>
                      <button
                        type="button"
                        className="rounded-[5px] bg-slate-100 px-3 py-1 text-xs font-bold text-ink-900/70"
                        onClick={() => setOptionsOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto border-t border-slate-100">
                      {previewButtons.map((button: any) => {
                        const FlowIcon =
                          button.type === "FLOW"
                            ? iconForFlow((button as any).flowIcon)
                            : null;
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
                                    ? void copyToClipboard(
                                        `panel-${button.id}`,
                                        button.offerCode || "OFFER_CODE",
                                      )
                                    : null
                            }
                          >
                            {button.type === "URL" ? (
                              <ExternalLink size={14} />
                            ) : button.type === "PHONE_NUMBER" ||
                              button.type === "VOICE_CALL" ? (
                              <PhoneCall size={14} />
                            ) : button.type === "COPY_CODE" ? (
                              copyButtonIcon(copiedId === `panel-${button.id}`)
                            ) : button.type === "FLOW" && FlowIcon ? (
                              <FlowIcon size={14} />
                            ) : button.type === "FLOW" ? (
                              <Workflow size={14} />
                            ) : (
                              <MessageSquareReply size={14} />
                            )}
                            {button.type === "COPY_CODE" &&
                            copiedId === `panel-${button.id}`
                              ? "Copied"
                              : button.text}
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
      </div>
    </div>
  );
}
