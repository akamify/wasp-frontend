import { useEffect, useMemo, useState } from "react";
import { API } from "../api/api";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Spinner } from "../components/ui/Spinner";
import { InboxComposer } from "./conversations/InboxComposer";

type Conversation = {
  _id?: string;
  phone: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount?: number;
  contact?: { name?: string; company?: string } | null;
};
type ChatMessage = { _id: string; direction: "outbound" | "inbound"; status: string; createdAt: string; text?: string; payload?: { template?: { name?: string } } };

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : "-");

export default function ConversationsPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activePhone, setActivePhone] = useState("");
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const activeConversation = useMemo(() => items.find((item) => item.phone === activePhone) || null, [items, activePhone]);

  async function loadList(activeSearch = search) {
    setLoadingList(true);
    try {
      const data = await API.conversations.list({ limit: 120, search: activeSearch || undefined });
      const list = data.conversations || [];
      setItems(list);
      if (!activePhone && list[0]?.phone) setActivePhone(list[0].phone);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load inbox");
    } finally {
      setLoadingList(false);
    }
  }

  async function loadChat(phone: string) {
    if (!phone) return;
    setLoadingChat(true);
    try {
      const messagesRes = await API.messages.byPhone(phone);
      setMessages(messagesRes.messages || []);
      await API.conversations.read(phone);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load chat");
    } finally {
      setLoadingChat(false);
    }
  }

  useEffect(() => { loadList(""); }, []);
  useEffect(() => { if (activePhone) loadChat(activePhone); }, [activePhone]);
  useEffect(() => {
    const id = window.setInterval(() => {
      loadList(search);
      if (activePhone) loadChat(activePhone);
    }, 12000);
    return () => window.clearInterval(id);
  }, [search, activePhone]);
  useEffect(() => {
    if (!error && !ok) return;
    const timer = setTimeout(() => { setError(null); setOk(null); }, 3000);
    return () => clearTimeout(timer);
  }, [error, ok]);

  return (
    <div className="grid h-[calc(100dvh-7rem)] gap-3 overflow-hidden rounded-[5px] border border-ink-900/10 bg-white">
      <div className="flex items-center justify-between border-b border-ink-900/10 px-4 py-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-ink-800/55">Inbox</div>
          <div className="text-lg font-bold text-ink-900">WhatsApp Chatroom</div>
        </div>
        <div className="w-full max-w-xs">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search phone or name..." />
        </div>
      </div>

      {error ? <div className="px-3"><Alert tone="error">{error}</Alert></div> : null}
      {ok ? <div className="px-3"><Alert tone="success">{ok}</Alert></div> : null}

      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[320px_1fr]">
        <div className="min-h-0 overflow-y-auto border-r border-ink-900/10 bg-[#f7f8fa]">
          {loadingList ? <div className="p-4"><Spinner label="Loading chats..." /></div> : null}
          {!loadingList && items.length === 0 ? <div className="p-4 text-sm text-ink-800/60">No chats found.</div> : null}
          {items.map((item) => (
            <button key={item._id || item.phone} onClick={() => setActivePhone(item.phone)} className={`flex w-full cursor-pointer items-start justify-between gap-3 border-b border-ink-900/5 px-4 py-3 text-left transition ${activePhone === item.phone ? "bg-[#e9f5ff]" : "bg-transparent hover:bg-white"}`}>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink-900">{item.contact?.name || item.phone}</div>
                <div className="truncate text-xs text-ink-800/60">{item.lastMessagePreview || "-"}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-ink-800/55">{formatDate(item.lastMessageAt)}</div>
                {item.unreadCount ? <Badge tone="good" className="mt-1">{item.unreadCount}</Badge> : null}
              </div>
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-col bg-white">
          <div className="flex items-center justify-between border-b border-ink-900/10 bg-white px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-ink-900">{activeConversation?.contact?.name || activePhone || "Select chat"}</div>
              <div className="text-xs text-ink-800/60">{activeConversation?.phone || ""}</div>
            </div>
            {activeConversation?.contact?.company ? <Badge tone="neutral">{activeConversation.contact.company}</Badge> : null}
          </div>

          <div
            className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4"
            style={{
              backgroundImage: `url('${import.meta.env.BASE_URL}message-bg.png')`,
              backgroundSize: "auto auto",
              backgroundRepeat: "repeat",
              // backgroundColor: "#ffffff",
              filter: "grayscale(0.22) sepia(0.1) hue-rotate(8deg) saturate(0.72)",
              opacity: 0.80,
            }}
          >
            {loadingChat ? <Spinner label="Loading messages..." /> : null}
            {!loadingChat && messages.length === 0 ? <div className="text-sm text-ink-800/70">No messages in this chat yet.</div> : null}
            {messages.map((message) => (
              <div key={message._id} className={`max-w-[82%] rounded-[5px] px-3 py-2 ${message.direction === "outbound" ? "ml-auto bg-[#dcf8c6]" : "mr-auto bg-white"} `}>
                <div className="whitespace-pre-wrap text-sm text-ink-900">
                  {message.text || (message.payload?.template?.name ? `Template: ${message.payload.template.name}` : "[message]")}
                </div>
                <div className="mt-1 text-right text-[10px] text-ink-800/55">{formatDate(message.createdAt)}</div>
              </div>
            ))}
          </div>

          <InboxComposer
            to={activePhone}
            disabled={!activePhone}
            sendTextMessage={API.messages.sendText}
            onSent={async (message) => {
              setOk(message);
              await loadChat(activePhone);
              await loadList(search);
            }}
            onError={setError}
          />
        </div>
      </div>
    </div>
  );
}
