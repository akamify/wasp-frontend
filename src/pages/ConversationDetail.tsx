import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import {
  inspectTemplate,
  parseCommaList,
  type TemplateRecord,
} from "../utils/templateRuntime";

type ChatMessage = {
  _id: string;
  direction: "outbound" | "inbound";
  status: string;
  createdAt: string;
  text?: string;
  payload?: {
    template?: {
      name?: string;
    };
  };
};

type Contact = {
  _id?: string;
  phone: string;
  name?: string;
  company?: string;
  email?: string;
  notes?: string;
  tags?: string[];
};

type ConversationMeta = {
  phone: string;
  unreadCount?: number;
  lastMessagePreview?: string;
  lastMessageAt?: string | null;
};

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function statusTone(status: string) {
  if (status === "read") return "good";
  if (status === "failed") return "bad";
  if (status === "delivered") return "warn";
  return "neutral";
}

export default function ConversationDetailPage() {
  const { phone = "" } = useParams();
  const [conversation, setConversation] = useState<ConversationMeta | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [busy, setBusy] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState("");
  const [headerVariables, setHeaderVariables] = useState("");
  const [variables, setVariables] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [buttonValues, setButtonValues] = useState("");

  const approvedTemplates = useMemo(
    () => templates.filter((template) => template.status === "approved"),
    [templates]
  );

  const selectedTemplate = useMemo(
    () => approvedTemplates.find((template) => template._id === templateId),
    [approvedTemplates, templateId]
  );

  const summary = useMemo(() => inspectTemplate(selectedTemplate), [selectedTemplate]);

  async function loadData() {
    setBusy(true);
    setError(null);
    try {
      const [conversationRes, messagesRes, templatesRes] = await Promise.all([
        API.conversations.get(phone),
        API.messages.byPhone(phone),
        API.templates.list(),
      ]);

      const approved = (templatesRes.templates || []).filter(
        (template: TemplateRecord) => template.status === "approved"
      );

      setConversation(conversationRes.conversation || null);
      setContact(conversationRes.contact || null);
      setMessages(messagesRes.messages || []);
      setTemplates(templatesRes.templates || []);
      setTemplateId((current) => {
        if (current) return current;
        const helloWorld = approved.find((template: TemplateRecord) => template.name === "hello_world");
        return helloWorld?._id || approved[0]?._id || "";
      });
      await API.conversations.read(phone);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load conversation");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [phone]);

  useEffect(() => {
    const id = window.setInterval(() => {
      loadData();
    }, 12000);

    return () => window.clearInterval(id);
  }, [phone]);

  async function sendTemplateMessage(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    setOk(null);

    try {
      const res = await API.messages.send({
        templateId,
        to: conversation?.phone || phone,
        headerVariables: parseCommaList(headerVariables),
        variables: parseCommaList(variables),
        otpCode: otpCode.trim(),
        buttonValues: parseCommaList(buttonValues),
      });
      setOk(`Message queued. ID: ${res.message?.whatsappMessageId || res.message?._id}`);
      setHeaderVariables("");
      setVariables("");
      setOtpCode("");
      setButtonValues("");
      await loadData();
    } catch (e: any) {
      setError(
        e?.response?.data?.details?.providerError ||
          e?.response?.data?.details?.metaDebug?.meta?.error_user_msg ||
          e?.response?.data?.message ||
          "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-[5px] border border-ink-900/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(236,255,248,0.92))] p-6 text-ink-900 shadow-[0_24px_90px_rgba(0,0,0,0.18)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-800/55">
              Chatroom
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              {contact?.name || conversation?.phone || phone}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="neutral">{conversation?.phone || phone}</Badge>
              {contact?.company ? <Badge tone="neutral">{contact.company}</Badge> : null}
              {contact?.tags?.slice(0, 3).map((tag) => (
                <Badge key={tag} tone="good">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/app/conversations">
              <Button variant="ghost">Back to inbox</Button>
            </Link>
            <Link to="/app/contacts">
              <Button variant="ghost">Manage contacts</Button>
            </Link>
          </div>
        </div>
      </section>

      {error ? <Alert>{error}</Alert> : null}
      {ok ? (
        <div className="rounded-[5px] bg-brand-50 px-4 py-3 text-sm text-ink-900 ring-1 ring-brand-200">
          {ok}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="flex min-h-[680px] flex-col p-0">
          <div className="border-b border-ink-900/8 px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/55">
                  Conversation stream
                </div>
                <div className="mt-1 text-xl font-black tracking-tight text-ink-900">
                  Incoming and outgoing messages
                </div>
              </div>
              <Badge tone="neutral">{messages.length} messages</Badge>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,#eefaf4_0%,#f7fbf9_100%)] px-5 py-5">
            {busy ? (
              <Spinner label="Loading messages..." />
            ) : messages.length ? (
              messages.map((message) => (
                <div
                  key={message._id}
                  className={
                    message.direction === "outbound"
                      ? "ml-auto max-w-[88%] rounded-[26px] rounded-br-md bg-[linear-gradient(140deg,#06b77e,#2ef7b3)] p-4 text-ink-900 shadow-[0_18px_40px_rgba(6,183,126,0.18)]"
                      : "mr-auto max-w-[88%] rounded-[26px] rounded-bl-md bg-white p-4 text-ink-900 ring-1 ring-ink-900/8 shadow-[0_18px_36px_rgba(15,23,42,0.06)]"
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs opacity-75">{formatDate(message.createdAt)}</div>
                    <Badge
                      tone={statusTone(message.status)}
                      className={
                        message.direction === "outbound" ? "bg-white/55 text-ink-900" : undefined
                      }
                    >
                      {message.status}
                    </Badge>
                  </div>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-7">
                    {message.text ||
                      (message.payload?.template?.name
                        ? `Template: ${message.payload.template.name}`
                        : "[message]")}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[5px] border border-dashed border-ink-900/12 bg-white/74 p-6 text-sm text-ink-800/70">
                No messages for this thread yet.
              </div>
            )}
          </div>
        </Card>

        <div className="grid gap-5">
          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/55">
              Contact detail
            </div>
            <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">
              {contact?.name || conversation?.phone || phone}
            </div>

            <div className="mt-5 grid gap-3 text-sm text-ink-800/74">
              <div className="rounded-[5px] bg-slate-50 px-4 py-3 ring-1 ring-ink-900/8">
                <div className="text-xs uppercase tracking-[0.18em] text-ink-800/55">Phone</div>
                <div className="mt-2 font-semibold text-ink-900">{conversation?.phone || phone}</div>
              </div>
              {contact?.email ? (
                <div className="rounded-[5px] bg-slate-50 px-4 py-3 ring-1 ring-ink-900/8">
                  <div className="text-xs uppercase tracking-[0.18em] text-ink-800/55">Email</div>
                  <div className="mt-2 font-semibold text-ink-900">{contact.email}</div>
                </div>
              ) : null}
              {contact?.notes ? (
                <div className="rounded-[5px] bg-slate-50 px-4 py-3 ring-1 ring-ink-900/8">
                  <div className="text-xs uppercase tracking-[0.18em] text-ink-800/55">Notes</div>
                  <div className="mt-2 text-ink-900">{contact.notes}</div>
                </div>
              ) : null}
              <div className="rounded-[5px] bg-slate-50 px-4 py-3 ring-1 ring-ink-900/8">
                <div className="text-xs uppercase tracking-[0.18em] text-ink-800/55">Unread</div>
                <div className="mt-2 font-semibold text-ink-900">{conversation?.unreadCount || 0}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/55">
              Send from chatroom
            </div>
            <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">
              Use any approved template
            </div>
            <div className="mt-2 text-sm text-ink-800/72">
              This sends directly to the current thread, so support and campaign follow-up stay in one place.
            </div>

            <form className="mt-5 grid gap-4" onSubmit={sendTemplateMessage}>
              <Select
                label="Approved template"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                required
              >
                <option value="">Select approved template...</option>
                {approvedTemplates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name} ({template.language})
                  </option>
                ))}
              </Select>

              {selectedTemplate ? (
                <div className="rounded-[5px] border border-ink-900/8 bg-slate-50/80 p-4 text-sm text-ink-800/74">
                  <div className="font-semibold text-ink-900">{selectedTemplate.name}</div>
                  <div className="mt-2">
                    {selectedTemplate.category} | {selectedTemplate.language} | {selectedTemplate.source || "local"}
                  </div>
                </div>
              ) : null}

              {summary.headerVariableCount > 0 ? (
                <Input
                  label={`Header variables (${summary.headerVariableCount} required)`}
                  value={headerVariables}
                  onChange={(e) => setHeaderVariables(e.target.value)}
                  placeholder="Festival sale"
                />
              ) : null}

              {summary.bodyVariableCount > 0 ? (
                <Input
                  label={`Body variables (${summary.bodyVariableCount} required)`}
                  value={variables}
                  onChange={(e) => setVariables(e.target.value)}
                  placeholder="John, order-483"
                />
              ) : null}

              {summary.otpButtons > 0 ? (
                <Input
                  label="OTP code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                />
              ) : null}

              {summary.dynamicUrlButtons.length > 0 ? (
                <Input
                  label="Dynamic URL values"
                  value={buttonValues}
                  onChange={(e) => setButtonValues(e.target.value)}
                  placeholder="order-123, campaign-x"
                  hint={summary.dynamicUrlButtons
                    .map((button) => `${button.index + 1}: ${button.label}`)
                    .join(" | ")}
                />
              ) : null}

              <Button type="submit" disabled={sending || !templateId}>
                {sending ? "Sending..." : "Send into this chat"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
