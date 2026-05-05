import { useState } from "react";
import { Button } from "../../components/ui/Button";

type Props = {
  to: string;
  disabled?: boolean;
  onSent: (message: string) => void;
  onError: (message: string) => void;
  sendTextMessage: (payload: any) => Promise<any>;
};

const QUICK_EMOJIS = ["🙂", "😂", "❤️", "👍", "🙏", "🔥"];

export function InboxComposer({ to, disabled, onSent, onError, sendTextMessage }: Props) {
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = text.trim();
    if (!body || !to) return;
    setSending(true);
    try {
      const res = await sendTextMessage({ to, text: body });
      onSent(`Sent. Message ID: ${res.message?.whatsappMessageId || res.message?._id}`);
      setText("");
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

  return (
    <form className="grid gap-2 border-t border-ink-900/10 bg-white p-3" onSubmit={submit}>
      <div className="flex flex-wrap gap-1">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="cursor-pointer rounded-[5px] border border-ink-900/10 bg-white px-2 py-1 text-sm"
            onClick={() => setText((prev) => `${prev}${emoji}`)}
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          className="min-h-[42px] flex-1 resize-none rounded-[5px] border border-ink-900/12 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-brand-300"
          rows={2}
          disabled={disabled || sending}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit(event);
            }
          }}
        />
        <Button type="submit" disabled={sending || !to || disabled || !text.trim()}>
          {sending ? "Sending..." : "Send"}
        </Button>
      </div>
    </form>
  );
}

