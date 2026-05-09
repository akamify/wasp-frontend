import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../api/api";
import { ConversationListSkeleton, ChatMessagesSkeleton } from "../components/ui/Skeletons";
import { InboxComposer } from "./conversations/InboxComposer";
import { cn } from "../utils/cn";
import { ArrowLeft, Ban, X, Search, Phone, Video, Info, CheckCircle2, AlertCircle, MessageSquare, Check, CheckCheck, ExternalLink, FileText, MapPin, Workflow, Trash2, Edit3, Mail, Tag, StickyNote, Languages } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  extractMetaDebugFields,
  formatMetaDebugInline,
  isMetaBillingEligibilityPaymentIssue,
} from "../utils/metaErrors";

type Conversation = {
  _id?: string;
  phone: string;
  lastMessageAt?: string;
  lastInboundAt?: string | null;
  lastMessagePreview?: string;
  unreadCount?: number;
  contact?: { name?: string; company?: string } | null;
};

type ChatMessage = {
  _id: string;
  direction: "outbound" | "inbound";
  status: string;
  createdAt: string;
  text?: string;
  payload?: {
    template?: { name?: string };
    image?: { link: string };
    document?: { link: string; filename?: string };
    audio?: { id?: string; link?: string };
    video?: { id?: string; link?: string };
  };
  error?: any;
  display?: any;
};

const CUSTOMER_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

function formatChatTime(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
}

function formatDurationShort(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function renderWhatsAppInline(text: string) {
  const parts: any[] = [];
  const regex = /(\*[^*]+\*|_[^_]+_|~[^~]+~|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(String(text || ""))) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const content = token.slice(1, -1);
    if (token.startsWith("*")) parts.push(<strong key={`b-${parts.length}`}>{content}</strong>);
    else if (token.startsWith("_")) parts.push(<em key={`i-${parts.length}`}>{content}</em>);
    else if (token.startsWith("~")) parts.push(<del key={`s-${parts.length}`}>{content}</del>);
    else if (token.startsWith("`")) {
      parts.push(
        <code key={`c-${parts.length}`} className="rounded bg-slate-100 px-1 text-[12px] text-slate-700">
          {content}
        </code>
      );
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length ? parts : text;
}

function renderWhatsAppText(text: string) {
  const segments = String(text || "").split("```");
  return segments.map((segment, idx) => {
    if (idx % 2 === 1) {
      return (
        <code key={`mono-${idx}`} className="block rounded bg-slate-100 px-2 py-1 text-[12px] text-slate-700">
          {segment}
        </code>
      );
    }
    return <span key={`seg-${idx}`}>{renderWhatsAppInline(segment)}</span>;
  });
}

export default function ConversationsPage() {
  const { phone: urlPhone = "" } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [mediaLoading, setMediaLoading] = useState<Record<string, true>>({});
  const [mediaErrors, setMediaErrors] = useState<Record<string, string>>({});
  const [now, setNow] = useState(() => Date.now());
  const [showProfile, setShowProfile] = useState(false);
  const [contactDetail, setContactDetail] = useState<any | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editForm, setEditForm] = useState<any>({ name: "", email: "", language: "", tags: "", notes: "" });
  const isInitialLoad = useRef(true);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const lastInboundToneIdRef = useRef<string>("");

  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConversation = useMemo(() => items.find((item) => item.phone === urlPhone) || null, [items, urlPhone]);
  const waLink = useMemo(() => {
    const p = String(urlPhone || "").replace(/[^\d]/g, "");
    return p ? `https://wa.me/${p}` : "";
  }, [urlPhone]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = headerMenuRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown, true);
    return () => window.removeEventListener("mousedown", onDown, true);
  }, [menuOpen]);

  function playInboundToneOnce() {
    try {
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as any;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.01);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.2);
      osc.onended = () => {
        try { ctx.close(); } catch { }
      };
    } catch { }
  }

  useEffect(() => {
    if (!messages.length) return;
    // Play once per newest inbound message (when chat is open).
    const latestInbound = [...messages].reverse().find((m) => m.direction === "inbound");
    if (!latestInbound?._id) return;
    if (lastInboundToneIdRef.current === latestInbound._id) return;
    lastInboundToneIdRef.current = latestInbound._id;
    playInboundToneOnce();
  }, [messages.length, urlPhone]);

  const customerServiceWindowOpen = useMemo(() => {
    const fromConversation = activeConversation?.lastInboundAt ? new Date(activeConversation.lastInboundAt).getTime() : NaN;
    const lastInboundAt =
      Number.isFinite(fromConversation) && fromConversation > 0
        ? fromConversation
        : new Date(
          [...messages].reverse().find((m) => m.direction === "inbound" && !!m.createdAt)?.createdAt || ""
        ).getTime();
    if (!Number.isFinite(lastInboundAt) || lastInboundAt <= 0) return false;
    return now - lastInboundAt < CUSTOMER_SERVICE_WINDOW_MS;
  }, [messages, activeConversation?.lastInboundAt, now]);

  const windowRemainingMs = useMemo(() => {
    const fromConversation = activeConversation?.lastInboundAt ? new Date(activeConversation.lastInboundAt).getTime() : NaN;
    const lastInboundAt =
      Number.isFinite(fromConversation) && fromConversation > 0
        ? fromConversation
        : new Date([...messages].reverse().find((m) => m.direction === "inbound" && !!m.createdAt)?.createdAt || "").getTime();
    if (!Number.isFinite(lastInboundAt) || lastInboundAt <= 0) return 0;
    const closesAt = lastInboundAt + CUSTOMER_SERVICE_WINDOW_MS;
    return Math.max(closesAt - now, 0);
  }, [messages, activeConversation?.lastInboundAt, now]);

  function getErrorMessage(error: any): string {
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

  function renderMetaBillingGuidance(err: any) {
    const provider = getErrorMessage(err);
    const debug = formatMetaDebugInline(extractMetaDebugFields(err));
    return (
      <div className="space-y-1">
        <div className="text-[10px] font-black uppercase tracking-widest text-rose-700">
          Meta billing / eligibility issue
        </div>
        <div className="text-[10px] font-bold leading-relaxed text-rose-700/90">
          Fix: Meta Business Manager → WhatsApp Manager → Payment method / billing setup + business verification.
        </div>
        <div className="text-[10px] font-bold text-rose-700/80">{provider}</div>
        {debug ? <div className="text-[9px] font-bold text-rose-700/70">{debug}</div> : null}
      </div>
    );
  }
  function statusMark(message: ChatMessage) {
    if (message.direction !== "outbound") return null;
    const s = String(message.status || "").toLowerCase();

    if (s === "failed" || s === "timeout_unknown") {
      return <span className="ml-1 text-[10px] font-black text-rose-600">!</span>;
    }
    if (s === "read") {
      return <CheckCheck className="ml-1 inline-block text-blue-600" size={14} strokeWidth={3} />;
    }
    if (s === "delivered") {
      return <CheckCheck className="ml-1 inline-block text-ink-900/55" size={14} strokeWidth={3} />;
    }
    if (s === "sent" || s === "accepted") {
      return <Check className="ml-1 inline-block text-ink-900/55" size={14} strokeWidth={3} />;
    }
    return <Check className="ml-1 inline-block text-ink-900/55" size={14} strokeWidth={3} />;
  }

  async function ensureMediaUrl(id: string) {
    const key = String(id || "").trim();
    if (!key) return;
    if (mediaUrls[key] || mediaLoading[key]) return;
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
      setMediaErrors((prev) => ({
        ...prev,
        [key]: e?.response?.data?.message || e?.message || "Failed to load media",
      }));
    } finally {
      setMediaLoading((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  useEffect(() => {
    const ids = new Set<string>();
    for (const m of messages) {
      const imgId = (m as any)?.payload?.image?.id;
      const vidId = (m as any)?.payload?.video?.id;
      const audId = (m as any)?.payload?.audio?.id;
      const docId = (m as any)?.payload?.document?.id;
      if (imgId) ids.add(String(imgId));
      if (vidId) ids.add(String(vidId));
      if (audId) ids.add(String(audId));
      if (docId) ids.add(String(docId));

      const components = Array.isArray((m as any)?.payload?.components) ? (m as any).payload.components : [];
      for (const component of components) {
        if (String(component?.type || "").toLowerCase() !== "header") continue;
        const firstParam = Array.isArray(component?.parameters) ? component.parameters[0] : null;
        const paramType = String(firstParam?.type || "").toLowerCase();
        if (paramType === "image" && firstParam?.image?.id) ids.add(String(firstParam.image.id));
        if (paramType === "video" && firstParam?.video?.id) ids.add(String(firstParam.video.id));
        if (paramType === "audio" && firstParam?.audio?.id) ids.add(String(firstParam.audio.id));
        if (paramType === "document" && firstParam?.document?.id) ids.add(String(firstParam.document.id));
      }
    }

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
        } catch { }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderMessageContent(message: ChatMessage) {
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
          {headerImageId && mediaUrls[headerImageId] ? (
            <div className="cursor-pointer group relative overflow-hidden rounded-[5px] mb-1" onClick={() => setSelectedImage(mediaUrls[headerImageId])}>
              <img src={mediaUrls[headerImageId]} alt="" className="max-w-full object-contain transition-transform group-hover:scale-[1.01]" />
            </div>
          ) : null}
          {headerImageId && !mediaUrls[headerImageId] ? (
            <button
              type="button"
              onClick={() => void ensureMediaUrl(headerImageId)}
              className="w-full text-left rounded-[5px] bg-white/70 px-3 py-2 ring-1 ring-ink-900/10"
            >
              <div className="text-xs font-black uppercase tracking-widest text-ink-900/60">Image</div>
              <div className="mt-1 text-xs font-semibold text-ink-900/70">
                {mediaLoading[headerImageId] ? "Loading..." : mediaErrors[headerImageId] ? mediaErrors[headerImageId] : "Tap to load"}
              </div>
            </button>
          ) : null}

          {headerVideoId && mediaUrls[headerVideoId] ? (
            <video controls src={mediaUrls[headerVideoId]} className="max-w-full rounded-[5px] ring-1 ring-ink-900/10" />
          ) : null}
          {headerVideoId && !mediaUrls[headerVideoId] ? (
            <button
              type="button"
              onClick={() => void ensureMediaUrl(headerVideoId)}
              className="w-full text-left rounded-[5px] bg-white/70 px-3 py-2 ring-1 ring-ink-900/10"
            >
              <div className="text-xs font-black uppercase tracking-widest text-ink-900/60">Video</div>
              <div className="mt-1 text-xs font-semibold text-ink-900/70">
                {mediaLoading[headerVideoId] ? "Loading..." : mediaErrors[headerVideoId] ? mediaErrors[headerVideoId] : "Tap to load"}
              </div>
            </button>
          ) : null}

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

          {headerText ? (
            <div className="break-words text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-900/55 [overflow-wrap:anywhere]">
              {renderWhatsAppText(headerText)}
            </div>
          ) : null}
          {bodyText ? (
            <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed tracking-tight [overflow-wrap:anywhere]">
              {renderWhatsAppText(bodyText)}
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed tracking-tight [overflow-wrap:anywhere]">
              {renderWhatsAppText(String(message.text || ""))}
            </div>
          )}
          {footerText && (
            <div className="break-words text-[10px] font-semibold uppercase tracking-widest text-ink-900/40 [overflow-wrap:anywhere]">
              {renderWhatsAppText(footerText)}
            </div>
          )}
          {buttonComps.length ? (
            <div className="overflow-hidden rounded-[8px] border border-ink-900/10 bg-white/90">
              {buttonComps.slice(0, 3).map((button: any, index: number) => {
                const subtype = String(button?.sub_type || button?.subType || "").toLowerCase();
                const text = String(button?.text || button?.label || `Option ${index + 1}`).trim() || `Option ${index + 1}`;
                return (
                  <div
                    key={`btn-${index}`}
                    className="flex items-center justify-center gap-2 border-b border-ink-900/8 px-3 py-2 text-xs font-bold text-brand-600 last:border-b-0"
                  >
                    {subtype === "url" ? <ExternalLink size={13} /> : null}
                    {subtype === "phone_number" ? <Phone size={13} /> : null}
                    {subtype === "flow" ? <Workflow size={13} /> : null}
                    {!["url", "phone_number", "flow"].includes(subtype) ? <MessageSquare size={13} /> : null}
                    <span className="truncate">{text}</span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      );
    }

    if (message.display?.kind === "media") {
      const t = String(message.display.mediaType || "").toLowerCase();
      if (t === "audio") {
        const inboundAudioId = (message as any)?.payload?.audio?.id;
        const inboundAudioLink = (message as any)?.payload?.audio?.link;
        if (inboundAudioId && mediaUrls[String(inboundAudioId)]) {
          const src = mediaUrls[String(inboundAudioId)];
          return (
            <div className="w-[260px] max-w-[72vw]">
              <audio controls src={src} className="block w-full" />
            </div>
          );
        }
        if (inboundAudioLink) {
          return (
            <div className="w-[260px] max-w-[72vw]">
              <audio controls src={String(inboundAudioLink)} className="block w-full" />
            </div>
          );
        }
        if (inboundAudioId) {
          const id = String(inboundAudioId);
          return (
            <button
              type="button"
              onClick={() => void ensureMediaUrl(id)}
              className="w-full text-left rounded-[8px] bg-white/70 px-3 py-2 ring-1 ring-ink-900/10"
            >
              <div className="text-xs font-black uppercase tracking-widest text-ink-900/60">Audio</div>
              <div className="mt-1 text-xs font-semibold text-ink-900/70">
                {mediaLoading[id] ? "Loading..." : mediaErrors[id] ? mediaErrors[id] : "Tap to load"}
              </div>
            </button>
          );
        }
        return <div className="text-[13px] font-semibold text-ink-900/70">Audio unavailable</div>;
      }
    }
    const inboundImageId = (message as any)?.payload?.image?.id;
    const inboundVideoId = (message as any)?.payload?.video?.id;
    const inboundAudioId = (message as any)?.payload?.audio?.id;
    const inboundAudioLink = (message as any)?.payload?.audio?.link;
    const inboundDoc = (message as any)?.payload?.document;
    const inboundContacts = (message as any)?.payload?.contacts;

    if (inboundImageId && mediaUrls[String(inboundImageId)]) {
      const src = mediaUrls[String(inboundImageId)];
      return (
        <div className="cursor-pointer group relative overflow-hidden rounded-[8px] mb-1" onClick={() => setSelectedImage(src)}>
          <img src={src} alt="" className="max-w-full object-contain transition-transform group-hover:scale-[1.01]" />
        </div>
      );
    }
    if (inboundImageId && !mediaUrls[String(inboundImageId)]) {
      const id = String(inboundImageId);
      return (
        <button
          type="button"
          onClick={() => void ensureMediaUrl(id)}
          className="w-full text-left rounded-[8px] bg-white/70 px-3 py-2 ring-1 ring-ink-900/10"
        >
          <div className="text-xs font-black uppercase tracking-widest text-ink-900/60">Image</div>
          <div className="mt-1 text-xs font-semibold text-ink-900/70">
            {mediaLoading[id] ? "Loading..." : mediaErrors[id] ? mediaErrors[id] : "Tap to load"}
          </div>
        </button>
      );
    }

    if (inboundVideoId && mediaUrls[String(inboundVideoId)]) {
      const src = mediaUrls[String(inboundVideoId)];
      return <video controls src={src} className="max-w-full rounded-[8px] ring-1 ring-ink-900/10" />;
    }
    if (inboundVideoId && !mediaUrls[String(inboundVideoId)]) {
      const id = String(inboundVideoId);
      return (
        <button
          type="button"
          onClick={() => void ensureMediaUrl(id)}
          className="w-full text-left rounded-[8px] bg-white/70 px-3 py-2 ring-1 ring-ink-900/10"
        >
          <div className="text-xs font-black uppercase tracking-widest text-ink-900/60">Video</div>
          <div className="mt-1 text-xs font-semibold text-ink-900/70">
            {mediaLoading[id] ? "Loading..." : mediaErrors[id] ? mediaErrors[id] : "Tap to load"}
          </div>
        </button>
      );
    }

    if (inboundAudioId && mediaUrls[String(inboundAudioId)]) {
      const src = mediaUrls[String(inboundAudioId)];
      return (
        <div className="w-[260px] max-w-[72vw]">
          <audio controls src={src} className="block w-full" />
        </div>
      );
    }
    if (inboundAudioLink) {
      return (
        <div className="w-[260px] max-w-[72vw]">
          <audio controls src={String(inboundAudioLink)} className="block w-full" />
        </div>
      );
    }
    if (inboundAudioId && !mediaUrls[String(inboundAudioId)]) {
      const id = String(inboundAudioId);
      return (
        <button
          type="button"
          onClick={() => void ensureMediaUrl(id)}
          className="w-full text-left rounded-[8px] bg-white/70 px-3 py-2 ring-1 ring-ink-900/10"
        >
          <div className="text-xs font-black uppercase tracking-widest text-ink-900/60">Audio</div>
          <div className="mt-1 text-xs font-semibold text-ink-900/70">
            {mediaLoading[id] ? "Loading..." : mediaErrors[id] ? mediaErrors[id] : "Tap to load"}
          </div>
        </button>
      );
    }

    if (inboundDoc?.id && mediaUrls[String(inboundDoc.id)]) {
      const href = mediaUrls[String(inboundDoc.id)];
      const name = inboundDoc?.filename ? String(inboundDoc.filename) : "Document";
      return (
        <div className="w-full max-w-[360px] rounded-[8px] border border-ink-900/10 bg-white px-3 py-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[8px] bg-slate-100 text-slate-600">
              <FileText size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-black text-ink-900">{name}</div>
              <div className="mt-0.5 text-[11px] font-semibold text-ink-900/45">Document</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-[11px] font-black">
            <a className="text-brand-600 hover:underline" href={href} target="_blank" rel="noreferrer">
              Open
            </a>
            <a className="text-ink-900/65 hover:underline" href={href} download={name}>
              Download
            </a>
          </div>
        </div>
      );
    }
    if (inboundDoc?.id && !mediaUrls[String(inboundDoc.id)]) {
      const id = String(inboundDoc.id);
      const name = inboundDoc?.filename ? String(inboundDoc.filename) : "Document";
      return (
        <button
          type="button"
          onClick={() => void ensureMediaUrl(id)}
          className="w-full text-left rounded-[8px] bg-white/70 px-3 py-2 ring-1 ring-ink-900/10"
        >
          <div className="text-xs font-black uppercase tracking-widest text-ink-900/60">{name}</div>
          <div className="mt-1 text-xs font-semibold text-ink-900/70">
            {mediaLoading[id] ? "Loading..." : mediaErrors[id] ? mediaErrors[id] : "Tap to download"}
          </div>
        </button>
      );
    }

    if (Array.isArray(inboundContacts) && inboundContacts.length) {
      return <div className="text-[13px] font-semibold text-ink-900/70">Shared {inboundContacts.length} contact(s)</div>;
    }

    if (message.payload?.image?.link) {
      return (
        <div className="cursor-pointer group relative overflow-hidden rounded-[8px] mb-1" onClick={() => setSelectedImage(message.payload?.image?.link || null)}>
          <img src={message.payload.image.link} alt="" className="max-w-full object-contain transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
      );
    }
    const plainText =
      typeof message.text === "string"
        ? message.text
        : message.display?.body
          ? String(message.display.body)
          : message.payload?.template?.name ? `Template: ${message.payload.template.name}` : "";
    const normalizedPlain = String(plainText || "").trim().toLowerCase();
    if (normalizedPlain === "[audio]" || normalizedPlain === "[voice]") {
      if (inboundAudioId && mediaUrls[String(inboundAudioId)]) {
        const src = mediaUrls[String(inboundAudioId)];
        return (
          <div className="w-[260px] max-w-[72vw]">
            <audio controls src={src} className="block w-full" />
          </div>
        );
      }
      if (inboundAudioLink) {
        return (
          <div className="w-[260px] max-w-[72vw]">
            <audio controls src={String(inboundAudioLink)} className="block w-full" />
          </div>
        );
      }
      if (inboundAudioId) {
        return (
          <button
            type="button"
            onClick={() => void ensureMediaUrl(String(inboundAudioId))}
            className="w-full text-left rounded-[5px] bg-white/70 px-3 py-2 ring-1 ring-ink-900/10"
          >
            <div className="text-xs font-black uppercase tracking-widest text-ink-900/60">Audio</div>
            <div className="mt-1 text-xs font-semibold text-ink-900/70">
              {mediaLoading[String(inboundAudioId)] ? "Loading..." : mediaErrors[String(inboundAudioId)] ? mediaErrors[String(inboundAudioId)] : "Tap to load"}
            </div>
          </button>
        );
      }
      return <div className="text-[13px] font-semibold text-ink-900/70">Audio unavailable</div>;
    }
    return (
      <div className="whitespace-pre-wrap break-words pb-1 text-[15px] leading-relaxed tracking-tight [overflow-wrap:anywhere]">
        {plainText || "[No Content]"}
      </div>
    );
  }

  async function loadList() {
    setLoadingList(true);
    try {
      const data = await API.conversations.list({ limit: 120, search: search || undefined });
      setItems(data.conversations || []);
      // If no phone in URL, and we have items, we could navigate to the first one, but let's keep it empty for "no chat selected" state
    } catch (e: any) { setError("List load failed"); } finally { setLoadingList(false); }
  }

  async function refreshListSilently() {
    try {
      const data = await API.conversations.list({ limit: 120, search: search || undefined });
      setItems(data.conversations || []);
    } catch { }
  }

  async function loadChat(phone: string) {
    if (!phone) return;
    setLoadingChat(true);
    try {
      const [res, convo] = await Promise.all([API.messages.byPhone(phone), API.conversations.get(phone)]);
      setMessages(res.messages || []);
      setContactDetail(convo?.contact || null);
      await API.conversations.read(phone);
    } catch (e) { setError("Chat load failed"); } finally { setLoadingChat(false); }
  }

  async function refreshChatSilently(phone: string) {
    if (!phone) return;
    try {
      const res = await API.messages.byPhone(phone);
      setMessages(res.messages || []);
    } catch { }
  }

  async function clearChat() {
    if (!urlPhone) return;
    const ok = window.confirm("Clear this chat? This will delete all messages for this conversation.");
    if (!ok) return;
    try {
      await API.conversations.clear(urlPhone);
      setMenuOpen(false);
      await loadChat(urlPhone);
      await refreshListSilently();
      setOk("Chat cleared");
      window.setTimeout(() => setOk(null), 2000);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to clear chat");
    }
  }

  function openEdit() {
    const c = contactDetail || {};
    setEditForm({
      name: c?.name || "",
      email: c?.email || "",
      language: c?.language || "",
      tags: Array.isArray(c?.tags) ? c.tags.join(", ") : "",
      notes: c?.notes || "",
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!urlPhone) return;
    setEditBusy(true);
    try {
      const payload: any = {
        phone: urlPhone,
        name: String(editForm.name || "").trim(),
        email: String(editForm.email || "").trim(),
        language: String(editForm.language || "").trim(),
        notes: String(editForm.notes || "").trim(),
        tags: String(editForm.tags || "")
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean),
      };
      let updated = null;
      if (contactDetail?._id) {
        const res = await API.contacts.update(String(contactDetail._id), payload);
        updated = res?.contact || null;
      } else {
        const res = await API.contacts.create(payload);
        updated = res?.contact || null;
      }
      setContactDetail(updated);
      setEditOpen(false);
      setOk("Contact saved");
      window.setTimeout(() => setOk(null), 2000);
      await refreshListSilently();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to save contact");
    } finally {
      setEditBusy(false);
    }
  }

  useEffect(() => { loadList(); }, [search]);
  useEffect(() => {
    if (urlPhone) {
      loadChat(urlPhone);
      isInitialLoad.current = true;
    } else {
      setMessages([]);
    }
  }, [urlPhone]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refreshListSilently();
      if (urlPhone) void refreshChatSilently(urlPhone);
    }, 10000);
    return () => window.clearInterval(id);
  }, [urlPhone, search]);

  useEffect(() => {
    if (!loadingChat && messages.length > 0) {
      const behavior = isInitialLoad.current ? "instant" : "smooth";
      const scroll = () => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: behavior as any
          });
        }
      };
      scroll();
      const timer = setTimeout(scroll, 150);
      if (isInitialLoad.current) isInitialLoad.current = false;
      return () => clearTimeout(timer);
    }
  }, [messages.length, loadingChat]);

  return (
    <div className="flex bg-white overflow-hidden relative h-dvh lg:h-full min-h-0">

      {/* 1. Sidebar: Chat List */}
      <div className="w-full md:w-[350px] bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-0">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col gap-4">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loadingList ? <ConversationListSkeleton rows={12} /> : items.map((item) => (
            <button
              key={item.phone}
              onClick={() => navigate(`/app/conversations/${item.phone}`)}
              className={cn(
                "w-full flex items-center gap-4 cursor-pointer p-4 transition-all border-b border-slate-50 relative group",
                urlPhone === item.phone ? "bg-brand-50/50" : "hover:bg-slate-50"
              )}
            >
              <div className="h-12 w-12 rounded-[8px] bg-slate-100 shrink-0 overflow-hidden shadow-sm relative">
                <img src={`https://ui-avatars.com/api/?name=${item.contact?.name || item.phone}&background=random&size=128`} alt="" className="h-full w-full object-cover" />

              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="mb-0.5 flex min-w-0 items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                    <span className="block max-w-full truncate pr-2 text-sm font-black text-slate-900">{item.contact?.name || `+${item.phone}`}</span>
                    <p
                      className="block w-full max-w-full truncate text-xs font-medium leading-none text-slate-500"
                      title={item.lastMessagePreview || "No messages yet"}
                    >
                      {item.lastMessagePreview || "No messages yet"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                      {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                    {Number(item.unreadCount || 0) > 0 && (
                      <span className="w-5 h-5 bg-brand-600 text-white text-[10px] font-black rounded-[5px] flex items-center justify-center ring-2 ring-white">
                        {Number(item.unreadCount || 0)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {urlPhone === item.phone && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-600 rounded-l-[5px] shadow-lg shadow-brand-500/20" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Body: Message Area */}
      <div className={cn("flex-1 flex flex-col bg-[#F8FAFC] relative min-h-0", !urlPhone ? "hidden md:flex" : "flex")}>
        {urlPhone ? (
          <>
            {/* Chat Header */}
            <div className="h-16 flex items-center justify-between px-3 md:px-6 bg-white border-b border-slate-100 shrink-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    navigate("/app/conversations");
                  }}
                  className="md:hidden -ml-2 p-2.5 hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-[5px] transition-all"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="hidden md:block h-10 w-10 rounded-[8px] bg-slate-100 overflow-hidden shadow-sm">
                  <img
                    src={`https://ui-avatars.com/api/?name=${activeConversation?.contact?.name || urlPhone}&background=random`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowProfile(true)}
                  className="md:hidden h-10 w-10 rounded-[8px] bg-slate-100 overflow-hidden shadow-sm ring-0 hover:ring-2 hover:ring-brand-600/10 transition-all"
                  aria-label="Open contact profile"
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${activeConversation?.contact?.name || urlPhone}&background=random`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
                <div className="min-w-0">
                  <button
                    type="button"
                    className="font-black text-sm text-slate-900 leading-none mb-1 truncate hover:text-brand-600 transition-colors"
                    onClick={() => { if (waLink) window.open(waLink, "_blank", "noopener,noreferrer"); }}
                    title="Open in WhatsApp"
                  >
                    {contactDetail?.name || activeConversation?.contact?.name || `+${urlPhone}`}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <div className={cn("h-2 w-2 rounded-full animate-pulse", customerServiceWindowOpen ? "bg-emerald-500" : "bg-rose-500")} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {customerServiceWindowOpen ? `Window open` : "Window closed"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2.5 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[5px] transition-all"><Video size={20} /></button>
                <button className="p-2.5 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[5px] transition-all"><Phone size={18} /></button>
                <div className="w-px h-6 bg-slate-100 mx-1" />
                <div ref={headerMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className={cn(
                      "inline-flex p-2.5 rounded-[5px] transition-all",
                      menuOpen ? "bg-brand-50 text-brand-600" : "hover:bg-slate-50 text-slate-400 hover:text-slate-900"
                    )}
                    aria-label="Info"
                  >
                    <Info size={20} />
                  </button>
                  {menuOpen ? (
                    <div className="absolute right-0 top-12 z-30 w-56 overflow-hidden rounded-[10px] border border-slate-100 bg-white shadow-xl">
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); openEdit(); }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <Edit3 size={16} /> Edit contact
                      </button>
                      <button
                        type="button"
                        onClick={() => void clearChat()}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={16} /> Clear chat
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div
              ref={scrollRef}
              className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 md:px-8 py-4 space-y-3 custom-scrollbar bg-[linear-gradient(180deg,#eefaf4_0%,#f7fbf9_100%)]"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(15,23,42,0.12) 1px, transparent 1px), linear-gradient(180deg, rgba(238,250,244,0.92) 0%, rgba(247,251,249,0.96) 100%)",
                backgroundSize: "22px 22px, cover",
                backgroundRepeat: "repeat, no-repeat",
                backgroundPosition: "0 0, 0 0",
              }}
            >
              {loadingChat ? <ChatMessagesSkeleton count={10} /> : messages.map((m) => (
                <div
                  key={m._id}
                  className={cn(
                    "flex w-full",
                    m.direction === "outbound" ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "relative max-w-[75%] w-fit p-3.5 pt-2 text-ink-900 shadow-sm transition-all rounded-[5px] overflow-visible",
                    m.direction === "outbound"
                      ? "bubble-outbound rounded-tr-none bg-white shadow-md"
                      : "bubble-inbound rounded-tl-none bg-[#e1ffc7]"
                  )}>
                    <div className="relative min-w-[70px]">
                      {renderMessageContent(m)}
                      <div className="flex items-center justify-end gap-0.5 mt-0.5">
                        <span className={cn(
                          "text-[9.5px] font-bold uppercase tracking-wider",
                          m.direction === "outbound" ? "text-ink-900/50" : "text-ink-800/40"
                        )}>
                          {formatChatTime(m.createdAt)}
                        </span>
                        {m.direction === "outbound" ? statusMark(m) : null}
                      </div>
                    </div>
                    {m.direction === "outbound" && m.status === "failed" && m.error && (
                      <div className="mt-3 border-t border-ink-900/10 pt-3 text-[10px] font-bold text-rose-600">
                        {isMetaBillingEligibilityPaymentIssue(getErrorMessage(m.error))
                          ? renderMetaBillingGuidance(m.error)
                          : getErrorMessage(m.error)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Composer Area */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              {!customerServiceWindowOpen && (
                <div className="mb-4 bg-amber-50 border border-amber-100 p-3 rounded-[5px] flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-[5px]"><Info size={16} /></div>
                  <div>
                    <p className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Window Closed</p>
                    <p className="text-[10px] font-bold text-amber-700/80 leading-relaxed">The 24-hour customer service window has expired. Please use a template to re-engage.</p>
                  </div>
                </div>
              )}
              <div className="max-w-4xl mx-auto">
                <InboxComposer
                  to={urlPhone}
                  disabled={!urlPhone}
                  forceDisabledReason={customerServiceWindowOpen ? undefined : "Customer service window is closed"}
                  sendTextMessage={API.messages.sendText}
                  uploadMedia={API.messages.uploadMedia}
                  sendMediaMessage={API.messages.sendMedia}
                  onSent={(msg) => { setOk(msg); refreshChatSilently(urlPhone); setTimeout(() => setOk(null), 3000); }}
                  onError={setError}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/50">
            <div className="h-24 w-24 bg-brand-100 rounded-[20px] flex items-center justify-center text-brand-600 mb-6 shadow-inner">
              <MessageSquare size={48} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Inbox</h2>
            <p className="mt-2 text-slate-500 font-bold max-w-sm">Select a conversation from the sidebar to start messaging. All your WhatsApp interactions are synced in real-time.</p>
          </div>
        )}

        {/* Floating Notifications */}
        <AnimatePresence>
          {(error || ok) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-16 right-4 z-[9999] w-[calc(100vw-2rem)] md:bottom-6 md:right-6 md:w-auto md:min-w-[320px] md:max-w-md"
            >
              <div className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl",
                error ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"
              )}>
                {error ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                <span className="line-clamp-2 min-w-0 flex-1 break-words text-sm font-bold leading-snug">
                  {error || ok}
                </span>
                <button onClick={() => { setError(null); setOk(null); }} className="shrink-0 rounded-lg p-1 text-black/20 transition-colors hover:bg-black/5 hover:text-black"><X size={14} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Right Sidebar: Profile (always open on desktop) */}
      {urlPhone ? (
        <div className="hidden md:flex w-[340px] bg-white border-l border-slate-200 overflow-y-auto flex-col shrink-0">
          <div className="p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 rounded-[10px] bg-slate-100 overflow-hidden shadow-sm shrink-0">
                  <img src={`https://ui-avatars.com/api/?name=${contactDetail?.name || urlPhone}&background=random`} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-slate-900">{contactDetail?.name || activeConversation?.contact?.name || "Unknown"}</div>
                  <div className="text-xs font-bold text-slate-400">{`+${urlPhone}`}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={openEdit}
                className="inline-flex items-center gap-2 rounded-[5px] border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
              >
                <Edit3 size={14} /> Edit
              </button>
            </div>

            <div className="mt-5 rounded-[12px] border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-start flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full", customerServiceWindowOpen ? "bg-emerald-500" : "bg-rose-500")} />
                  <div className="text-xs font-black uppercase tracking-widest text-slate-600">
                    {customerServiceWindowOpen ? "Window Open" : "Window Closed"}
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {customerServiceWindowOpen ? `${formatDurationShort(windowRemainingMs)} left` : "Closed"}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-[5px] border border-slate-100 bg-white p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Mail size={12} /> Email
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900">{contactDetail?.email || "Not set"}</div>
              </div>
              <div className="rounded-[5px] border border-slate-100 bg-white p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Languages size={12} /> Language
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900">{contactDetail?.language || "Not set"}</div>
              </div>
              <div className="rounded-[5px] border border-slate-100 bg-white p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Tag size={12} /> Tags
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Array.isArray(contactDetail?.tags) ? contactDetail.tags : []).length ? (
                    (contactDetail.tags || []).slice(0, 10).map((t: string) => (
                      <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{t}</span>
                    ))
                  ) : (
                    <span className="text-sm font-bold text-slate-900">Not set</span>
                  )}
                </div>
              </div>
              <div className="rounded-[5px] border border-slate-100 bg-white p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <StickyNote size={12} /> Notes
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-800 whitespace-pre-wrap">{contactDetail?.notes || "Not set"}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Mobile Profile Drawer */}
      <AnimatePresence>
        {showProfile && activeConversation && (
          <motion.div
            className="md:hidden fixed inset-0 z-[80]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/25 backdrop-blur-[1px]"
              aria-label="Close profile"
              onClick={() => setShowProfile(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 35 }}
              className="absolute right-0 top-0 bottom-0 w-[100%] max-w-[420px] bg-white shadow-2xl border-l border-slate-200 flex flex-col"
            >
              <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
                <div className="text-sm font-black text-slate-900 tracking-tight">Contact info</div>
                <button
                  type="button"
                  onClick={() => setShowProfile(false)}
                  className="p-2 hover:bg-slate-50 rounded-[5px] text-slate-500 hover:text-slate-900 transition-all"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 flex flex-col items-center overflow-y-auto custom-scrollbar">
                <div className="h-24 w-24 rounded-[10px] bg-slate-100 overflow-hidden shadow-sm mb-6">
                  <img
                    src={`https://ui-avatars.com/api/?name=${activeConversation?.contact?.name || urlPhone}&background=random`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>

                <h2 className="text-xl font-black text-slate-900 tracking-tight text-center">
                  {activeConversation.contact?.name || "Anonymous Contact"}
                </h2>
                <p className="text-sm font-bold text-slate-400 mt-1">{`+${urlPhone}`}</p>

                <div className="w-full mt-8 space-y-4 px-2">
                  <div className="p-4 bg-slate-50 rounded-[10px] border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          customerServiceWindowOpen
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            : "bg-rose-500"
                        )}
                      />
                      <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">
                        {customerServiceWindowOpen ? "Window Open" : "Session Expired"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company</span>
                      <span className="text-sm font-bold text-slate-900">{activeConversation.contact?.company || "Not set"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Interaction</span>
                      <span className="text-sm font-bold text-slate-900">
                        {activeConversation.lastMessageAt ? new Date(activeConversation.lastMessageAt).toLocaleDateString() : "Never"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Contact Modal */}
      {editOpen ? (
        <div
          className="fixed inset-0 z-[120] bg-slate-900/40 backdrop-blur-sm p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setEditOpen(false); }}
        >
          <div className="mx-auto my-12 w-full max-w-xl overflow-hidden rounded-[5px] bg-white shadow-2xl ring-1 ring-black/10">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="text-sm font-black text-slate-900">Edit contact</div>
              <button className="rounded-[5px] p-2 text-slate-500 hover:bg-slate-50" onClick={() => setEditOpen(false)}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">Name</div>
                  <input className="mt-2 w-full rounded-[5px] border border-slate-200 px-3 py-2 text-sm font-semibold" value={editForm.name} onChange={(e) => setEditForm((p: any) => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">Email</div>
                  <input className="mt-2 w-full rounded-[5px] border border-slate-200 px-3 py-2 text-sm font-semibold" value={editForm.email} onChange={(e) => setEditForm((p: any) => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Language</div>
                <input className="mt-2 w-full rounded-[5px] border border-slate-200 px-3 py-2 text-sm font-semibold" value={editForm.language} onChange={(e) => setEditForm((p: any) => ({ ...p, language: e.target.value }))} placeholder="e.g. en, hi" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Tags (comma separated)</div>
                <input className="mt-2 w-full rounded-[5px] border border-slate-200 px-3 py-2 text-sm font-semibold" value={editForm.tags} onChange={(e) => setEditForm((p: any) => ({ ...p, tags: e.target.value }))} placeholder="vip, lead, returning" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Notes</div>
                <textarea className="mt-2 w-full min-h-[110px] rounded-[5px] border border-slate-200 px-3 py-2 text-sm font-semibold" value={editForm.notes} onChange={(e) => setEditForm((p: any) => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button className="rounded-[5px] border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50" onClick={() => setEditOpen(false)}>Cancel</button>
                <button disabled={editBusy} className="rounded-[5px] bg-brand-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50" onClick={() => void saveEdit()}>
                  {editBusy ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-8" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-[5px] transition-all"><X size={24} /></button>
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={selectedImage}
            className="max-w-full max-h-full rounded-[8px] shadow-2xl border border-white/10"
            alt=""
          />
        </div>
      )}
    </div>
  );
}
