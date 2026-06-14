import { ExternalLink, FileText, MapPin, MessageSquare, Phone, Workflow, Ban } from "lucide-react";
import type { ReactNode } from "react";
import type { ChatMessage } from "@modules/conversations/types/conversations.types";
import { renderWhatsAppText } from "@modules/conversations/utils/renderWhatsAppText";

type Props = {
  ensureMediaUrl: (id: string) => void;
  mediaErrors: Record<string, string>;
  mediaLoading: Record<string, true>;
  mediaUrls: Record<string, string>;
  message: ChatMessage;
  setSelectedImage: (value: string | null) => void;
};

export function MessageContent({ ensureMediaUrl, mediaErrors, mediaLoading, mediaUrls, message, setSelectedImage }: Props) {
  const isDeletedInbound =
    message.direction === "inbound" &&
    ((message as any)?.payload?.deleted ||
      String(message.text || "").trim().toLowerCase() === "[deleted]" ||
      String((message as any)?.payload?.type || "").toLowerCase() === "unsupported");

  if (isDeletedInbound) {
    return (
      <div className="flex items-center gap-2 pb-1 text-[13px] font-semibold italic text-ink-900/60">
        <Ban size={15} className="shrink-0" />
        <span>Message deleted</span>
      </div>
    );
  }

  if (message.display?.kind === "template") {
    return (
      <TemplateMessage
        ensureMediaUrl={ensureMediaUrl}
        mediaErrors={mediaErrors}
        mediaLoading={mediaLoading}
        mediaUrls={mediaUrls}
        message={message}
        setSelectedImage={setSelectedImage}
      />
    );
  }

  return (
    <MediaOrPlainMessage
      ensureMediaUrl={ensureMediaUrl}
      mediaErrors={mediaErrors}
      mediaLoading={mediaLoading}
      mediaUrls={mediaUrls}
      message={message}
      setSelectedImage={setSelectedImage}
    />
  );
}

function TemplateMessage(props: Props) {
  const { ensureMediaUrl, mediaErrors, mediaLoading, mediaUrls, message, setSelectedImage } = props;
  const components = Array.isArray((message as any)?.payload?.components) ? (message as any).payload.components : [];
  const headerComp = components.find((c: any) => String(c?.type || "").toLowerCase() === "header");
  const footerComp = components.find((c: any) => String(c?.type || "").toLowerCase() === "footer");
  const buttonComps = components.filter((c: any) => String(c?.type || "").toLowerCase() === "button");
  const headerText = String(message.display?.header || "").trim();
  const bodyText = String(message.display?.body || "").trim();
  const footerText = String(message.display?.footer || footerComp?.text || "").trim();
  const firstHeaderParam = Array.isArray(headerComp?.parameters) ? headerComp.parameters[0] : null;
  const headerType = String(firstHeaderParam?.type || "").toLowerCase();
  const headerImageId = headerType === "image" ? String(firstHeaderParam?.image?.id || "") : "";
  const headerVideoId = headerType === "video" ? String(firstHeaderParam?.video?.id || "") : "";
  const headerDoc = headerType === "document" ? firstHeaderParam?.document : null;
  const headerLocation = headerType === "location" ? firstHeaderParam?.location : null;

  return (
    <div className="space-y-2 pb-1">
      <MediaPreview id={headerImageId} type="Image" rounded="rounded-[5px]" mediaErrors={mediaErrors} mediaLoading={mediaLoading} mediaUrls={mediaUrls} ensureMediaUrl={ensureMediaUrl} onImage={setSelectedImage} />
      <MediaPreview id={headerVideoId} type="Video" rounded="rounded-[5px]" mediaErrors={mediaErrors} mediaLoading={mediaLoading} mediaUrls={mediaUrls} ensureMediaUrl={ensureMediaUrl} />
      {headerDoc ? (
        <div className="rounded-[5px] border border-ink-900/10 bg-white/90 px-3 py-2">
          <div className="flex items-center gap-2 text-ink-900/70">
            <FileText size={14} />
            <span className="truncate text-xs font-bold">{String(headerDoc?.filename || "Document")}</span>
          </div>
        </div>
      ) : null}
      {headerLocation ? (
        <div className="rounded-[5px] border border-ink-900/10 bg-white/90 px-3 py-2">
          <div className="flex items-center gap-2 text-ink-900/70">
            <MapPin size={14} />
            <span className="text-xs font-bold">{String(headerLocation?.name || "Location")}</span>
          </div>
          {headerLocation?.address ? <div className="mt-1 text-[11px] text-ink-900/55">{String(headerLocation.address)}</div> : null}
        </div>
      ) : null}
      {headerText ? <TextBlock muted uppercase>{renderWhatsAppText(headerText)}</TextBlock> : null}
      <TextBlock>{renderWhatsAppText(bodyText || String(message.text || ""))}</TextBlock>
      {footerText ? <TextBlock muted uppercase small>{renderWhatsAppText(footerText)}</TextBlock> : null}
      {buttonComps.length ? <TemplateButtons buttons={buttonComps} /> : null}
    </div>
  );
}

function MediaOrPlainMessage(props: Props) {
  const { ensureMediaUrl, mediaErrors, mediaLoading, mediaUrls, message, setSelectedImage } = props;
  const payload = (message as any)?.payload || {};
  const inboundImageId = payload?.image?.id;
  const inboundVideoId = payload?.video?.id;
  const inboundAudioId = payload?.audio?.id;
  const inboundAudioLink = payload?.audio?.link;
  const inboundDoc = payload?.document;
  const inboundContacts = payload?.contacts;
  const interactiveButtons = Array.isArray(message.buttons)
    ? message.buttons
    : Array.isArray(payload?.interactive?.action?.buttons)
      ? payload.interactive.action.buttons
          .map((button: { reply?: { id?: string; title?: string } }) => ({
            id: String(button?.reply?.id || ""),
            title: String(button?.reply?.title || ""),
          }))
          .filter((button: { id: string; title: string }) => button.id && button.title)
      : [];

  if (message.display?.kind === "media" && String(message.display.mediaType || "").toLowerCase() === "audio") {
    return <AudioBlock id={inboundAudioId} link={inboundAudioLink} mediaErrors={mediaErrors} mediaLoading={mediaLoading} mediaUrls={mediaUrls} ensureMediaUrl={ensureMediaUrl} />;
  }
  if (inboundImageId) return <MediaPreview id={String(inboundImageId)} type="Image" mediaErrors={mediaErrors} mediaLoading={mediaLoading} mediaUrls={mediaUrls} ensureMediaUrl={ensureMediaUrl} onImage={setSelectedImage} />;
  if (inboundVideoId) return <MediaPreview id={String(inboundVideoId)} type="Video" mediaErrors={mediaErrors} mediaLoading={mediaLoading} mediaUrls={mediaUrls} ensureMediaUrl={ensureMediaUrl} />;
  if (inboundAudioId || inboundAudioLink) return <AudioBlock id={inboundAudioId} link={inboundAudioLink} mediaErrors={mediaErrors} mediaLoading={mediaLoading} mediaUrls={mediaUrls} ensureMediaUrl={ensureMediaUrl} />;
  if (inboundDoc?.id) return <DocumentBlock doc={inboundDoc} mediaErrors={mediaErrors} mediaLoading={mediaLoading} mediaUrls={mediaUrls} ensureMediaUrl={ensureMediaUrl} />;
  if (Array.isArray(inboundContacts) && inboundContacts.length) return <div className="text-[13px] font-semibold text-ink-900/70">Shared {inboundContacts.length} contact(s)</div>;
  if (
    message.type === "interactive_buttons" ||
    (payload?.type === "interactive" && payload?.interactive?.type === "button")
  ) {
    return (
      <div className="space-y-2 pb-1">
        <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed tracking-tight [overflow-wrap:anywhere]">
          {message.text || payload?.interactive?.body?.text || "[No Content]"}
        </div>
        <div className="overflow-hidden rounded-[8px] border border-ink-900/10 bg-white/90">
          {interactiveButtons.map((button: { id: string; title: string }) => (
            <div
              key={button.id}
              className="flex items-center justify-center gap-2 border-b border-ink-900/8 px-3 py-2 text-xs font-bold text-brand-600 last:border-b-0"
            >
              <MessageSquare size={13} />
              <span className="truncate">{button.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (message.payload?.image?.link) {
    return (
      <div className="cursor-pointer group relative overflow-hidden rounded-[8px] mb-1" onClick={() => setSelectedImage(message.payload?.image?.link || null)}>
        <img src={message.payload.image.link} alt="" className="max-w-full object-contain transition-transform group-hover:scale-105" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>
    );
  }
  const plainText = typeof message.text === "string" ? message.text : message.display?.body ? String(message.display.body) : message.payload?.template?.name ? `Template: ${message.payload.template.name}` : "";
  const normalizedPlain = String(plainText || "").trim().toLowerCase();
  if (normalizedPlain === "[audio]" || normalizedPlain === "[voice]") {
    return <AudioBlock id={inboundAudioId} link={inboundAudioLink} mediaErrors={mediaErrors} mediaLoading={mediaLoading} mediaUrls={mediaUrls} ensureMediaUrl={ensureMediaUrl} />;
  }
  return <div className="whitespace-pre-wrap break-words pb-1 text-[15px] leading-relaxed tracking-tight [overflow-wrap:anywhere]">{plainText || "[No Content]"}</div>;
}

function MediaPreview({ ensureMediaUrl, id, mediaErrors, mediaLoading, mediaUrls, onImage, rounded = "rounded-[8px]", type }: Pick<Props, "ensureMediaUrl" | "mediaErrors" | "mediaLoading" | "mediaUrls"> & { id?: string; onImage?: (value: string) => void; rounded?: string; type: "Image" | "Video" }) {
  if (!id) return null;
  const src = mediaUrls[id];
  if (src && type === "Image") {
    return <div className={`cursor-pointer group relative overflow-hidden ${rounded} mb-1`} onClick={() => onImage?.(src)}><img src={src} alt="" className="max-w-full object-contain transition-transform group-hover:scale-[1.01]" /></div>;
  }
  if (src && type === "Video") return <video controls src={src} className={`max-w-full ${rounded} ring-1 ring-ink-900/10`} />;
  return <LoadMediaButton id={id} label={type} mediaErrors={mediaErrors} mediaLoading={mediaLoading} ensureMediaUrl={ensureMediaUrl} />;
}

function AudioBlock({ ensureMediaUrl, id, link, mediaErrors, mediaLoading, mediaUrls }: Pick<Props, "ensureMediaUrl" | "mediaErrors" | "mediaLoading" | "mediaUrls"> & { id?: string; link?: string }) {
  const key = id ? String(id) : "";
  const src = key ? mediaUrls[key] : "";
  if (src || link) return <div className="w-[260px] max-w-[72vw]"><audio controls src={src || String(link)} className="block w-full" /></div>;
  if (key) return <LoadMediaButton id={key} label="Audio" mediaErrors={mediaErrors} mediaLoading={mediaLoading} ensureMediaUrl={ensureMediaUrl} />;
  return <div className="text-[13px] font-semibold text-ink-900/70">Audio unavailable</div>;
}

function DocumentBlock({ doc, ensureMediaUrl, mediaErrors, mediaLoading, mediaUrls }: Pick<Props, "ensureMediaUrl" | "mediaErrors" | "mediaLoading" | "mediaUrls"> & { doc: any }) {
  const id = String(doc.id);
  const href = mediaUrls[id];
  const name = doc?.filename ? String(doc.filename) : "Document";
  if (!href) return <LoadMediaButton id={id} label={name} action="Tap to download" mediaErrors={mediaErrors} mediaLoading={mediaLoading} ensureMediaUrl={ensureMediaUrl} />;
  return (
    <div className="w-full max-w-[360px] rounded-[8px] border border-ink-900/10 bg-white px-3 py-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[8px] bg-slate-100 text-slate-600"><FileText size={18} /></div>
        <div className="min-w-0 flex-1"><div className="truncate text-[12px] font-black text-ink-900">{name}</div><div className="mt-0.5 text-[11px] font-semibold text-ink-900/45">Document</div></div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] font-black">
        <a className="text-brand-600 hover:underline" href={href} target="_blank" rel="noreferrer">Open</a>
        <a className="text-ink-900/65 hover:underline" href={href} download={name}>Download</a>
      </div>
    </div>
  );
}

function LoadMediaButton({ action = "Tap to load", ensureMediaUrl, id, label, mediaErrors, mediaLoading }: Pick<Props, "ensureMediaUrl" | "mediaErrors" | "mediaLoading"> & { action?: string; id: string; label: string }) {
  return (
    <button type="button" onClick={() => ensureMediaUrl(id)} className="w-full text-left rounded-[5px] bg-white/70 px-3 py-2 ring-1 ring-ink-900/10">
      <div className="text-xs font-black uppercase tracking-widest text-ink-900/60">{label}</div>
      <div className="mt-1 text-xs font-semibold text-ink-900/70">{mediaLoading[id] ? "Loading..." : mediaErrors[id] ? mediaErrors[id] : action}</div>
    </button>
  );
}

function TextBlock({ children, muted, small, uppercase }: { children: ReactNode; muted?: boolean; small?: boolean; uppercase?: boolean }) {
  const cls = small ? "text-[10px]" : uppercase ? "text-[11px]" : "text-[15px]";
  return <div className={`break-words ${cls} ${uppercase ? "font-semibold uppercase tracking-[0.1em]" : "leading-relaxed tracking-tight whitespace-pre-wrap"} ${muted ? "text-ink-900/55" : ""} [overflow-wrap:anywhere]`}>{children}</div>;
}

function TemplateButtons({ buttons }: { buttons: any[] }) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-ink-900/10 bg-white/90">
      {buttons.slice(0, 3).map((button, index) => {
        const subtype = String(button?.sub_type || button?.subType || "").toLowerCase();
        const text = String(button?.text || button?.label || `Option ${index + 1}`).trim() || `Option ${index + 1}`;
        return (
          <div key={`btn-${index}`} className="flex items-center justify-center gap-2 border-b border-ink-900/8 px-3 py-2 text-xs font-bold text-brand-600 last:border-b-0">
            {subtype === "url" ? <ExternalLink size={13} /> : null}
            {subtype === "phone_number" ? <Phone size={13} /> : null}
            {subtype === "flow" ? <Workflow size={13} /> : null}
            {!["url", "phone_number", "flow"].includes(subtype) ? <MessageSquare size={13} /> : null}
            <span className="truncate">{text}</span>
          </div>
        );
      })}
    </div>
  );
}
