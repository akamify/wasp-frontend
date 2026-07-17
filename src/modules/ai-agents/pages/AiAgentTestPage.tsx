import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bot, BrainCircuit, RefreshCw, Send, ShieldAlert, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { useToast } from "@shared/providers/ToastContext";
import { aiAgentsApi } from "@modules/ai-agents/aiAgentsApi";
import type { AiAgent, AiConversationMessage, AiTestMessageResponse } from "@modules/ai-agents/types";

interface ChatItem {
  role: "user" | "assistant";
  text: string;
  meta?: AiTestMessageResponse | null;
}

export default function AiAgentTestPage() {
  const { agentId = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agent, setAgent] = useState<AiAgent | null>(null);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [contactId, setContactId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const lastMeta = useMemo(
    () => [...messages].reverse().find((item) => item.role === "assistant" && item.meta)?.meta || null,
    [messages],
  );

  async function loadAgent() {
    if (!agentId) return;
    setLoading(true);
    setError("");
    try {
      const list = await aiAgentsApi.list({ page: 1, limit: 100 });
      const found = (list.agents || []).find((item) => item.id === agentId || item._id === agentId) || null;
      if (!found) throw new Error("AI agent not found");
      setAgent(found);
      const conversations = await aiAgentsApi.conversations(agentId);
      const latest = (conversations.conversations as any[] || [])[0];
      const mapped = Array.isArray(latest?.messages)
        ? latest.messages
            .filter((message: AiConversationMessage) => ["user", "assistant"].includes(message.role))
            .map((message: AiConversationMessage) => ({
              role: message.role as "user" | "assistant",
              text: message.text,
              meta: message.role === "assistant" ? { confidence: Number((message.metadata as any)?.confidence || 0), action: (message.metadata as any)?.action || "reply", guardrail: { passed: !(message.metadata as any)?.guardrailReason, reason: (message.metadata as any)?.guardrailReason || null }, provider: (message.metadata as any)?.provider || "", model: (message.metadata as any)?.model || "", reply: message.text, success: true } as AiTestMessageResponse : null,
            }))
        : [];
      setMessages(mapped);
    } catch (requestError: any) {
      setError(requestError?.userMessage || requestError?.response?.data?.message || requestError?.message || "Unable to load AI agent test chat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAgent();
  }, [agentId]);

  async function sendMessage() {
    const message = input.trim();
    if (!message) return;
    setSending(true);
    setInput("");
    setMessages((current) => [...current, { role: "user", text: message }]);
    try {
      const response = await aiAgentsApi.testMessage(agentId, {
        message,
        ...(contactId.trim() ? { contactId: contactId.trim() } : {}),
      });
      setMessages((current) => [...current, { role: "assistant", text: response.reply, meta: response }]);
    } catch (requestError: any) {
      const apiMessage = requestError?.response?.data?.message || requestError?.message || "AI test failed.";
      setMessages((current) => [...current, { role: "assistant", text: apiMessage, meta: null }]);
      toast(apiMessage, "error");
    } finally {
      setSending(false);
    }
  }

  async function clearMemory() {
    setSending(true);
    try {
      await aiAgentsApi.clearTestMemory(agentId, contactId.trim() ? { contactId: contactId.trim() } : {});
      setMessages([]);
      toast("Test memory cleared.", "success");
    } catch (requestError: any) {
      toast(requestError?.response?.data?.message || requestError?.message || "Unable to clear memory.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-120px)] flex-col gap-5 p-4 md:p-8">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button type="button" onClick={() => navigate("/app/ai-agents")} className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-brand-600">
            <ArrowLeft size={15} />
            Back to AI agents
          </button>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-600">
            <Bot size={17} />
            Test runtime
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{agent?.name || "AI Agent Test"}</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Safe test environment only. No WhatsApp message is sent and Flow Builder is not involved.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void loadAgent()} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Reload
          </Button>
          <Button variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => void clearMemory()} disabled={sending}>
            <Trash2 size={16} />
            Clear memory
          </Button>
        </div>
      </section>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="flex min-h-[560px] flex-col overflow-hidden">
          <div className="border-b border-slate-100 bg-white p-4">
            <Input label="Optional contact ID for context" value={contactId} onChange={(event) => setContactId(event.target.value)} placeholder="Mongo contact id" />
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4">
            {loading ? <div className="h-40 animate-pulse rounded-[10px] bg-slate-200" /> : null}
            {!loading && messages.length === 0 ? (
              <div className="flex h-full min-h-80 flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-[12px] bg-brand-50 text-brand-700"><BrainCircuit size={27} /></div>
                <h3 className="mt-4 font-black text-slate-900">Send a test message</h3>
                <p className="mt-2 max-w-md text-sm font-medium text-slate-500">The runtime will build prompt, call provider/manual adapter, apply guardrails, save memory, and log usage.</p>
              </div>
            ) : null}
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-[12px] px-4 py-3 text-sm font-medium leading-6 shadow-sm ${message.role === "user" ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
                  <div className="whitespace-pre-wrap">{message.text}</div>
                  {message.meta ? (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <span>{Math.round(message.meta.confidence * 100)}% confidence</span>
                      <span>{message.meta.action}</span>
                      <span>{message.meta.provider}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 bg-white p-4">
            <div className="flex gap-2">
              <Textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask: website price kya hai?" className="min-h-[52px]" />
              <Button onClick={() => void sendMessage()} disabled={sending || !input.trim()} className="self-stretch">
                <Send size={17} />
                {sending ? "Sending" : "Send"}
              </Button>
            </div>
          </div>
        </Card>

        <aside className="space-y-4">
          <Card className="p-5">
            <h2 className="text-lg font-black text-slate-900">Runtime Result</h2>
            <div className="mt-4 space-y-3 text-sm">
              <Info label="Provider" value={lastMeta?.provider || agent?.modelProvider || "-"} />
              <Info label="Model" value={lastMeta?.model || agent?.modelName || "manual-test"} />
              <Info label="Action" value={lastMeta?.action || "-"} />
              <Info label="Confidence" value={lastMeta ? `${Math.round(lastMeta.confidence * 100)}%` : "-"} />
              <Info label="Credits" value={lastMeta?.usage?.creditsUsed ? String(lastMeta.usage.creditsUsed) : "-"} />
              <Info label="Latency" value={lastMeta?.usage?.latencyMs ? `${lastMeta.usage.latencyMs}ms` : "-"} />
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-900"><ShieldAlert size={18} /> Guardrail</h2>
            <p className="mt-3 rounded-[8px] bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-600">
              {lastMeta
                ? lastMeta.guardrail.passed
                  ? "Passed. Reply is allowed."
                  : `Triggered: ${lastMeta.guardrail.reason || "guardrail"}`
                : "No response yet."}
            </p>
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-black text-slate-900">Enabled Tools</h2>
            <div className="mt-3 space-y-2">
              {(agent?.tools || []).filter((tool) => tool.enabled).length ? (
                (agent?.tools || []).filter((tool) => tool.enabled).map((tool) => (
                  <div key={tool.type} className="rounded-[8px] border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-500">
                    {tool.type}
                  </div>
                ))
              ) : (
                <p className="text-sm font-medium text-slate-500">No tools enabled.</p>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] bg-slate-50 px-3 py-2">
      <span className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-sm font-black text-slate-800">{value}</span>
    </div>
  );
}
