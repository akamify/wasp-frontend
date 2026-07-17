import { useEffect, useMemo, useState } from "react";
import { BookOpen, Bot, BrainCircuit, CheckCircle2, MessageCircle, Plus, RefreshCw, Search, ShieldCheck, Trash2, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { Textarea } from "@components/ui/Textarea";
import { useToast } from "@shared/providers/ToastContext";
import { aiAgentsApi } from "@modules/ai-agents/aiAgentsApi";
import type { AiAgent, AiAgentPayload, AiAgentStatus, AiAgentToolType } from "@modules/ai-agents/types";

const TOOL_OPTIONS: Array<{ type: AiAgentToolType; label: string; description: string }> = [
  { type: "crm_lookup", label: "CRM lookup", description: "Read lead/contact context before answering." },
  { type: "contact_update", label: "Contact update", description: "Update basic contact profile fields." },
  { type: "set_tag", label: "Set tag", description: "Apply tags like qualified or support." },
  { type: "set_attribute", label: "Set attribute", description: "Save structured contact attributes." },
  { type: "api_request", label: "API request", description: "Call external systems later through tool config." },
  { type: "handover", label: "Human handover", description: "Transfer to inbox/CRM team when needed." },
];

const DEFAULT_AGENT: AiAgentPayload = {
  name: "",
  description: "",
  status: "draft",
  persona: "support",
  modelProvider: "manual",
  modelName: "",
  systemPrompt: "You are a helpful WhatsApp assistant. Answer only from configured business knowledge. If unsure, ask a clarifying question or hand over to a human.",
  language: "auto",
  temperature: 0.3,
  knowledgeSources: [],
  tools: [
    { type: "crm_lookup", enabled: true, config: {} },
    { type: "handover", enabled: true, config: {} },
  ],
  guardrails: {
    fallbackMessage: "I am not fully sure about that. Let me connect you with our team.",
    handoverOnLowConfidence: true,
    maxMessagesPerSession: 50,
    allowedTopics: [],
    blockedTopics: [],
  },
};

function csvToList(value: string) {
  return Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean)));
}

function listToCsv(value?: string[]) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function normalizeEditable(agent?: AiAgent | null): AiAgentPayload {
  if (!agent) return structuredClone(DEFAULT_AGENT);
  return {
    name: agent.name,
    slug: agent.slug,
    description: agent.description,
    status: agent.status,
    persona: agent.persona,
    modelProvider: agent.modelProvider,
    modelName: agent.modelName,
    systemPrompt: agent.systemPrompt,
    language: agent.language,
    temperature: agent.temperature,
    knowledgeSources: agent.knowledgeSources || [],
    tools: agent.tools || [],
    guardrails: agent.guardrails || DEFAULT_AGENT.guardrails,
  };
}

export default function AiAgentsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AiAgentStatus | "">("");
  const [selected, setSelected] = useState<AiAgent | null>(null);
  const [draft, setDraft] = useState<AiAgentPayload>(() => structuredClone(DEFAULT_AGENT));

  const filteredAgents = useMemo(() => agents, [agents]);

  async function loadAgents() {
    setLoading(true);
    setError("");
    try {
      const response = await aiAgentsApi.list({ search: search.trim(), status, page: 1, limit: 100 });
      setAgents(response.agents || []);
      if (selected) {
        const refreshed = (response.agents || []).find((agent) => agent.id === selected.id) || null;
        setSelected(refreshed);
      }
    } catch (requestError: any) {
      setError(requestError?.userMessage || requestError?.response?.data?.message || requestError?.message || "Unable to load AI agents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAgents(), 250);
    return () => window.clearTimeout(timer);
  }, [search, status]);

  function startCreate() {
    setSelected(null);
    setDraft(structuredClone(DEFAULT_AGENT));
  }

  function startEdit(agent: AiAgent) {
    setSelected(agent);
    setDraft(normalizeEditable(agent));
  }

  function updateDraft(patch: AiAgentPayload) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function toggleTool(type: AiAgentToolType, enabled: boolean) {
    const tools = [...(draft.tools || [])];
    const index = tools.findIndex((tool) => tool.type === type);
    if (index >= 0) tools[index] = { ...tools[index], enabled };
    else tools.push({ type, enabled, config: {} });
    updateDraft({ tools });
  }

  async function saveAgent() {
    if (!String(draft.name || "").trim()) {
      toast("Agent name required.", "warning");
      return;
    }
    setSaving(true);
    try {
      if (selected) {
        const response = await aiAgentsApi.update(selected.id, draft);
        toast("AI agent updated.", "success");
        setSelected(response.agent);
        setDraft(normalizeEditable(response.agent));
      } else {
        const response = await aiAgentsApi.create(draft);
        toast("AI agent created.", "success");
        setSelected(response.agent);
        setDraft(normalizeEditable(response.agent));
      }
      await loadAgents();
    } catch (requestError: any) {
      toast(requestError?.userMessage || requestError?.response?.data?.message || requestError?.message || "Unable to save AI agent.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAgent(agent: AiAgent) {
    if (!window.confirm(`Delete ${agent.name}? This archives the AI agent and preserves history.`)) return;
    setSaving(true);
    try {
      await aiAgentsApi.remove(agent.id);
      toast("AI agent deleted.", "success");
      if (selected?.id === agent.id) startCreate();
      await loadAgents();
    } catch (requestError: any) {
      toast(requestError?.userMessage || requestError?.response?.data?.message || requestError?.message || "Unable to delete AI agent.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-7 p-4 md:p-8">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-600">
            <Bot size={17} />
            Independent AI module
          </div>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">AI Agents</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            Create reusable AI assistants with persona, knowledge, tools, and guardrails. Flow Builder remains rule-based; later you can connect these agents through an AI Agent node.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadAgents()}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Sync
          </Button>
          <Button onClick={startCreate}>
            <Plus size={17} />
            New Agent
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="space-y-4">
          <div className="flex gap-2 rounded-[10px] border border-slate-200 bg-white p-3 shadow-sm">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search agents..." icon={<Search size={16} />} />
            <Select value={status} onChange={(event) => setStatus(event.target.value as AiAgentStatus | "")} className="w-36">
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <div className="space-y-3">
            {loading ? [1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-[10px] bg-slate-200/70" />) : null}
            {!loading && filteredAgents.length === 0 ? (
              <Card className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[10px] bg-brand-50 text-brand-700"><BrainCircuit size={24} /></div>
                <h3 className="mt-4 font-black text-slate-900">No AI agents yet</h3>
                <p className="mt-2 text-sm font-medium text-slate-500">Create Sales, Support, FAQ, or Booking agents.</p>
                <Button className="mt-4" onClick={startCreate}>Create agent</Button>
              </Card>
            ) : null}
            {!loading && filteredAgents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => startEdit(agent)}
                className={`w-full rounded-[10px] border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${selected?.id === agent.id ? "border-brand-400 ring-4 ring-brand-50" : "border-slate-200"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-slate-900">{agent.name}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">{agent.persona} · {agent.modelProvider}</div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${agent.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {agent.status}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-xs font-medium leading-5 text-slate-500">{agent.description || "No description"}</p>
                <div className="mt-3 flex gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <span>{agent.knowledgeSources?.length || 0} KB</span>
                  <span>{agent.tools?.filter((tool) => tool.enabled).length || 0} tools</span>
                </div>
                <div className="mt-4">
                  <span className="inline-flex items-center gap-1 rounded-[6px] bg-brand-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-brand-700">
                    <MessageCircle size={12} />
                    Test chat
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">{selected ? "Edit AI Agent" : "Create AI Agent"}</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">This agent is independent. It is not connected to Flow Builder yet.</p>
              </div>
              {selected ? (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate(`/app/ai-agents/${selected.id}/test`)}>
                    <MessageCircle size={16} />
                    Test
                  </Button>
                  <Button variant="outline" onClick={() => navigate(`/app/ai-agents/${selected.id}/knowledge`)}>
                    <BookOpen size={16} />
                    Knowledge
                  </Button>
                  <Button variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => void deleteAgent(selected)} disabled={saving}>
                    <Trash2 size={16} />
                    Delete
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Input label="Agent name" value={String(draft.name || "")} onChange={(event) => updateDraft({ name: event.target.value })} placeholder="Support Agent" />
              <Input label="Slug" value={String(draft.slug || "")} onChange={(event) => updateDraft({ slug: event.target.value })} placeholder="support-agent" />
              <Select label="Status" value={String(draft.status || "draft")} onChange={(event) => updateDraft({ status: event.target.value as AiAgentStatus })}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </Select>
              <Select label="Persona" value={String(draft.persona || "custom")} onChange={(event) => updateDraft({ persona: event.target.value as any })}>
                <option value="sales">Sales</option>
                <option value="support">Support</option>
                <option value="booking">Booking</option>
                <option value="faq">FAQ</option>
                <option value="custom">Custom</option>
              </Select>
              <Select label="Model provider" value={String(draft.modelProvider || "manual")} onChange={(event) => updateDraft({ modelProvider: event.target.value as any })}>
                <option value="manual">Manual / not connected</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
              </Select>
              <Input label="Model name" value={String(draft.modelName || "")} onChange={(event) => updateDraft({ modelName: event.target.value })} placeholder="gpt-4.1-mini / gemini-flash" />
            </div>
            <div className="mt-3">
              <Textarea label="Description" value={String(draft.description || "")} onChange={(event) => updateDraft({ description: event.target.value })} />
            </div>
            <div className="mt-3">
              <Textarea label="System prompt" value={String(draft.systemPrompt || "")} onChange={(event) => updateDraft({ systemPrompt: event.target.value })} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-black text-slate-900"><BookOpen size={18} /> Knowledge Base</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">Knowledge is managed in a dedicated indexed source manager, not inside the agent form.</p>
              </div>
              {selected ? (
                <Button variant="outline" onClick={() => navigate(`/app/ai-agents/${selected.id}/knowledge`)}>
                  <BookOpen size={16} />
                  Manage Knowledge
                </Button>
              ) : (
                <span className="text-xs font-bold text-slate-400">Create the agent first to add knowledge.</span>
              )}
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="flex items-center gap-2 text-lg font-black text-slate-900"><Wrench size={18} /> Tools</h3>
              <div className="mt-4 space-y-3">
                {TOOL_OPTIONS.map((tool) => {
                  const enabled = Boolean((draft.tools || []).find((item) => item.type === tool.type)?.enabled);
                  return (
                    <label key={tool.type} className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-slate-200 p-3">
                      <input type="checkbox" className="mt-1 h-4 w-4 accent-brand-600" checked={enabled} onChange={(event) => toggleTool(tool.type, event.target.checked)} />
                      <span>
                        <span className="block text-sm font-black text-slate-900">{tool.label}</span>
                        <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">{tool.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="flex items-center gap-2 text-lg font-black text-slate-900"><ShieldCheck size={18} /> Guardrails</h3>
              <div className="mt-4 space-y-3">
                <Input label="Max messages/session" type="number" min={1} max={500} value={Number(draft.guardrails?.maxMessagesPerSession || 50)} onChange={(event) => updateDraft({ guardrails: { ...(draft.guardrails as any), maxMessagesPerSession: Number(event.target.value) } })} />
                <Textarea label="Fallback message" value={String(draft.guardrails?.fallbackMessage || "")} onChange={(event) => updateDraft({ guardrails: { ...(draft.guardrails as any), fallbackMessage: event.target.value } })} />
                <Input label="Allowed topics" value={listToCsv(draft.guardrails?.allowedTopics)} onChange={(event) => updateDraft({ guardrails: { ...(draft.guardrails as any), allowedTopics: csvToList(event.target.value) } })} placeholder="pricing, delivery, support" />
                <Input label="Blocked topics" value={listToCsv(draft.guardrails?.blockedTopics)} onChange={(event) => updateDraft({ guardrails: { ...(draft.guardrails as any), blockedTopics: csvToList(event.target.value) } })} placeholder="legal advice, medical advice" />
                <label className="flex items-center gap-3 rounded-[8px] border border-slate-200 p-3 text-sm font-bold text-slate-700">
                  <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={draft.guardrails?.handoverOnLowConfidence !== false} onChange={(event) => updateDraft({ guardrails: { ...(draft.guardrails as any), handoverOnLowConfidence: event.target.checked } })} />
                  Handover on low confidence
                </label>
              </div>
            </Card>
          </div>

          <div className="sticky bottom-4 flex justify-end gap-2 rounded-[10px] border border-slate-200 bg-white/90 p-3 shadow-xl backdrop-blur">
            <Button variant="outline" onClick={startCreate}>Reset</Button>
            <Button onClick={() => void saveAgent()} disabled={saving}>
              <CheckCircle2 size={17} />
              {saving ? "Saving..." : selected ? "Save Agent" : "Create Agent"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
