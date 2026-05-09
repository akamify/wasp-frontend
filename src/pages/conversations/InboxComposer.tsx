import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Image, Loader2, Music, Paperclip, Search, Send, Smile, Video, X } from "lucide-react";

type Props = {
  to: string;
  disabled?: boolean;
  forceDisabledReason?: string;
  onSent: (message: string) => void;
  onError: (message: string) => void;
  sendTextMessage: (payload: any) => Promise<any>;
  uploadMedia?: (file: File, onProgress?: (pct: number) => void) => Promise<any>;
  sendMediaMessage?: (payload: any) => Promise<any>;
};

const EMOJI_DATA_URL = "https://unpkg.com/emoji.json@13.1.0/emoji.json";

export function InboxComposer({ to, disabled, forceDisabledReason, onSent, onError, sendTextMessage, uploadMedia, sendMediaMessage }: Props) {
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState("");
  const [emojiItems, setEmojiItems] = useState<Array<{ char: string; name?: string; category?: string }>>([]);
  const [emojiLoading, setEmojiLoading] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [attachKind, setAttachKind] = useState<"image" | "video" | "audio" | "document" | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPanelRef = useRef<HTMLDivElement>(null);
  const attachPanelRef = useRef<HTMLDivElement>(null);

  const isDisabled = Boolean(disabled || sending || forceDisabledReason);

  useEffect(() => {
    if (!showEmojis) return;
    if (emojiItems.length) return;
    let alive = true;
    (async () => {
      try {
        setEmojiLoading(true);
        const cached = localStorage.getItem("emoji_dataset_v1");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            if (alive) setEmojiItems(parsed);
            if (alive) setEmojiLoading(false);
            return;
          }
        }
      } catch {}

      try {
        const res = await fetch(EMOJI_DATA_URL, { cache: "force-cache" });
        const json = await res.json();
        const list = Array.isArray(json)
          ? json
              .map((e: any) => ({
                char: String(e?.char || e?.emoji || "").trim(),
                name: e?.name ? String(e.name) : undefined,
                category: e?.category ? String(e.category) : undefined,
              }))
              .filter((e: any) => e.char)
          : [];
        if (!alive) return;
        setEmojiItems(list);
        try {
          localStorage.setItem("emoji_dataset_v1", JSON.stringify(list));
        } catch {}
      } catch {
        if (alive) setEmojiItems([{ char: "🙂" }, { char: "😂" }, { char: "❤️" }, { char: "🔥" }, { char: "✅" }]);
      } finally {
        if (alive) setEmojiLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [showEmojis, emojiItems.length]);

  const filteredEmojis = useMemo(() => {
    const q = emojiSearch.trim().toLowerCase();
    const list = emojiItems.length ? emojiItems : [];
    if (!q) return list.slice(0, 480);
    return list
      .filter((e) => (e.name ? e.name.toLowerCase().includes(q) : false) || (e.category ? e.category.toLowerCase().includes(q) : false))
      .slice(0, 480);
  }, [emojiSearch, emojiItems]);

  useEffect(() => {
    if (!showEmojis && !showAttach) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (emojiPanelRef.current && emojiPanelRef.current.contains(t)) return;
      if (attachPanelRef.current && attachPanelRef.current.contains(t)) return;
      setShowEmojis(false);
      setEmojiSearch("");
      setShowAttach(false);
    };
    window.addEventListener("mousedown", onDown, true);
    return () => window.removeEventListener("mousedown", onDown, true);
  }, [showEmojis, showAttach]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "44px";
    const scrollHeight = textareaRef.current.scrollHeight;
    textareaRef.current.style.height = Math.min(scrollHeight, 120) + "px";
  }, [text]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = text.trim();
    if (!body || !to || isDisabled) return;

    setSending(true);
    try {
      const res = await sendTextMessage({ to, text: body });
      onSent(`Sent. Message ID: ${res.message?.whatsappMessageId || res.message?._id}`);
      setText("");
      setShowEmojis(false);
      setEmojiSearch("");
    } catch (e: any) {
      onError(
        e?.response?.data?.details?.providerError ||
          e?.response?.data?.details?.metaDebug?.meta?.error_user_msg ||
          e?.response?.data?.message ||
          "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => `${prev}${emoji}`);
    textareaRef.current?.focus();
  };

  const openFilePicker = (kind: "image" | "video" | "audio" | "document") => {
    setAttachKind(kind);
    setShowAttach(false);
    const input = fileInputRef.current;
    if (!input) return;
    input.value = "";
    input.accept =
      kind === "image"
        ? "image/*"
        : kind === "video"
          ? "video/*"
          : kind === "audio"
            ? "audio/*"
            : ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    input.click();
  };

  const onPickFile = async (file?: File | null) => {
    if (!file || !attachKind || !to || isDisabled) return;
    if (!uploadMedia || !sendMediaMessage) {
      onError("Media sending is not enabled for this page.");
      return;
    }
    setSending(true);
    try {
      const up = await uploadMedia(file);
      const mediaId = up?.mediaId;
      if (!mediaId) throw new Error("Upload failed: missing mediaId");
      const res = await sendMediaMessage({ to, type: attachKind, mediaId, caption: "" });
      onSent(`Sent. Message ID: ${res.message?.whatsappMessageId || res.message?._id}`);
      setAttachKind(null);
    } catch (e: any) {
      onError(e?.response?.data?.message || e?.message || "Failed to send media");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative flex flex-col bg-white md:bg-[#f0f2f5] p-2 md:p-3">
      {showEmojis && !isDisabled && (
        <div
          ref={emojiPanelRef}
          className="absolute bottom-[58px] left-2 right-2 z-30 rounded-lg bg-white p-2 shadow-xl border border-slate-200 animate-in slide-in-from-bottom-2 fade-in duration-200"
          style={{ maxHeight: "280px" }}
        >
          <div className="flex items-center gap-2 px-1 pb-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={emojiSearch}
                onChange={(e) => setEmojiSearch(e.target.value)}
                placeholder="Search (heart, fire, party...)"
                className="w-full rounded-[10px] border border-slate-200 bg-white py-2 pl-8 pr-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600"
              />
            </div>
            <button
              type="button"
              className="rounded-[10px] p-2 text-slate-500 hover:bg-slate-100"
              onClick={() => { setShowEmojis(false); setEmojiSearch(""); }}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1 overflow-y-auto pr-1" style={{ maxHeight: "220px" }}>
            {emojiLoading ? (
              <div className="px-2 py-3 text-xs font-semibold text-slate-500">Loading emojis...</div>
            ) : filteredEmojis.length ? (
              filteredEmojis.map((e) => (
                <button
                key={e.char}
                type="button"
                className="cursor-pointer rounded-md hover:bg-slate-100 p-1.5 text-xl transition-colors"
                onClick={() => handleEmojiClick(e.char)}
                disabled={isDisabled}
                title={e.name || e.char}
              >
                {e.char}
              </button>
            ))
            ) : (
              <div className="px-2 py-3 text-xs font-semibold text-slate-500">No results</div>
            )}
          </div>
        </div>
      )}

      <form className="flex items-end gap-2" onSubmit={submit}>
        <div className="flex gap-1.5 pb-2 text-slate-500">
          <div ref={attachPanelRef} className="relative">
            <button
              type="button"
              className={`p-1.5 rounded-full hover:bg-slate-200 transition-colors ${showAttach ? "text-brand-500 bg-slate-200" : "hover:text-slate-700"} disabled:opacity-50`}
              onClick={() => setShowAttach((v) => !v)}
              disabled={isDisabled}
              title="Attach"
            >
              <Paperclip size={22} />
            </button>
            {showAttach && !isDisabled ? (
              <div className="absolute bottom-12 left-0 z-20 w-52 overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-xl">
                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={() => openFilePicker("image")}>
                  <Image size={16} /> Image
                </button>
                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={() => openFilePicker("video")}>
                  <Video size={16} /> Video
                </button>
                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={() => openFilePicker("audio")}>
                  <Music size={16} /> Audio
                </button>
                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={() => openFilePicker("document")}>
                  <FileText size={16} /> Document
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className={`p-1.5 rounded-full hover:bg-slate-200 transition-colors ${showEmojis ? "text-brand-500 bg-slate-200" : "hover:text-slate-700"} disabled:opacity-50`}
            onClick={() => setShowEmojis((v) => !v)}
            disabled={isDisabled}
            title="Emojis"
          >
            <Smile size={24} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => void onPickFile(e.target.files?.[0] || null)}
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isDisabled ? "Chat is disabled" : "Type a message"}
          className="min-h-[44px] w-full flex-1 resize-none rounded-xl border-none bg-white px-3 py-2.5 md:px-4 md:py-3 text-sm text-ink-900 shadow-sm outline-none focus:ring-1 focus:ring-brand-300 disabled:bg-[#e9edef] disabled:text-slate-500"
          rows={1}
          disabled={isDisabled}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit(event);
            }
          }}
        />

        <button
          type="submit"
          disabled={sending || !to || isDisabled || !text.trim()}
          className="mb-0.5 flex h-10 w-10 md:h-[42px] md:w-[42px] shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white shadow-sm transition-colors hover:bg-[#008f6f] disabled:bg-slate-300 disabled:text-white"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="m-1" />}
        </button>
      </form>
    </div>
  );
}
