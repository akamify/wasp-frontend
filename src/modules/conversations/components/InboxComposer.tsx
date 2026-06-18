import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Loader2, Paperclip, Send, Smile } from "lucide-react";
import { AttachmentMenu } from "@modules/conversations/components/AttachmentMenu";
import { EmojiPopover } from "@modules/conversations/components/EmojiPopover";
import { useEmojiDataset } from "@modules/conversations/hooks/useEmojiDataset";

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

export function InboxComposer({ to, disabled, forceDisabledReason, onSent, onError, sendTextMessage, uploadMedia, sendMediaMessage }: Props) {
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [attachKind, setAttachKind] = useState<"image" | "video" | "audio" | "document" | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPanelRef = useRef<HTMLDivElement>(null);
  const attachPanelRef = useRef<HTMLDivElement>(null);

  const minTextareaHeight = 44;
  const maxTextareaHeight = 120;

  const isDisabled = Boolean(disabled || sending || forceDisabledReason);
  const emoji = useEmojiDataset(showEmojis);

  useEffect(() => {
    if (!showEmojis && !showAttach) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (emojiPanelRef.current && emojiPanelRef.current.contains(t)) return;
      if (attachPanelRef.current && attachPanelRef.current.contains(t)) return;
      setShowEmojis(false);
      emoji.setSearch("");
      setShowAttach(false);
    };
    window.addEventListener("mousedown", onDown, true);
    return () => window.removeEventListener("mousedown", onDown, true);
  }, [showEmojis, showAttach, emoji]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, minTextareaHeight), maxTextareaHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxTextareaHeight ? "auto" : "hidden";
  }, [text]);

  useEffect(() => {
    const fontSet = document.fonts;
    if (!fontSet?.ready) return;

    let cancelled = false;
    fontSet.ready.then(() => {
      if (cancelled) return;
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.style.height = "0px";
      const nextHeight = Math.min(Math.max(textarea.scrollHeight, minTextareaHeight), maxTextareaHeight);
      textarea.style.height = `${nextHeight}px`;
      textarea.style.overflowY = textarea.scrollHeight > maxTextareaHeight ? "auto" : "hidden";
    });

    return () => {
      cancelled = true;
    };
  }, []);

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
      emoji.setSearch("");
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

  const handleEmojiClick = (emojiChar: string) => {
    setText((prev) => `${prev}${emojiChar}`);
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
      {showEmojis ? (
        <EmojiPopover
          panelRef={emojiPanelRef}
          search={emoji.search}
          onSearchChange={emoji.setSearch}
          loading={emoji.loading}
          items={emoji.filtered}
          onEmojiClick={handleEmojiClick}
          onClose={() => {
            setShowEmojis(false);
            emoji.setSearch("");
          }}
          disabled={isDisabled}
        />
      ) : null}

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
            {showAttach ? <AttachmentMenu panelRef={attachPanelRef} onPick={openFilePicker} disabled={isDisabled} /> : null}
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
          className="min-h-[44px] w-full flex-1 resize-none overflow-y-hidden rounded-xl border-none bg-white px-3 py-2.5 text-sm leading-6 text-ink-900 shadow-sm outline-none focus:ring-1 focus:ring-brand-300 md:px-4 md:py-3 disabled:bg-[#e9edef] disabled:text-slate-500"
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

