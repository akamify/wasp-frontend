import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, FileQuestion, FileText, Globe2, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { Textarea } from "@components/ui/Textarea";
import { useToast } from "@shared/providers/ToastContext";
import { aiAgentsApi } from "@modules/ai-agents/aiAgentsApi";
import type { AiAgent, AiKnowledgePayload, AiKnowledgeSource, AiKnowledgeSourceType } from "@modules/ai-agents/types";

const EMPTY_DRAFT: AiKnowledgePayload = {
  type: "faq",
  title: "",
  question: "",
  answer: "",
  content: "",
  sourceUrl: "",
};

function statusClass(status: string) {
  if (status === "indexed") return "bg-emerald-50 text-emerald-700";
  if (status === "failed") return "bg-rose-50 text-rose-700";
  if (status === "indexing") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function sourceIcon(type: AiKnowledgeSourceType) {
  if (type === "faq") return <FileQuestion size={17} />;
  if (type === "url") return <Globe2 size={17} />;
  if (["pdf", "docx", "csv", "txt"].includes(type)) return <FileText size={17} />;
  return <BookOpen size={17} />;
}

function normalizeForEdit(source: AiKnowledgeSource): AiKnowledgePayload {
  return {
    type: source.type,
    title: source.title || "",
    question: source.metadata?.question || source.title || "",
    answer: source.metadata?.answer || source.content || "",
    content: source.content || "",
    sourceUrl: source.sourceUrl || "",
  };
}

export default function AiAgentKnowledgePage() {
  const { agentId = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agent, setAgent] = useState<AiAgent | null>(null);
  const [sources, setSources] = useState<AiKnowledgeSource[]>([]);
  const [selected, setSelected] = useState<AiKnowledgeSource | null>(null);
  const [draft, setDraft] = useState<AiKnowledgePayload>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    const totalChunks = sources.reduce((sum, source) => sum + Number(source.metadata?.totalChunks || 0), 0);
    const indexed = sources.filter((source) => source.status === "indexed").length;
    return { totalChunks, indexed };
  }, [sources]);

  async function load() {
    if (!agentId) return;
    setLoading(true);
    setError("");
    try {
      const [agentResponse, knowledgeResponse] = await Promise.all([
        aiAgentsApi.list({ page: 1, limit: 100 }),
        aiAgentsApi.knowledge.list(agentId),
      ]);
      setAgent((agentResponse.agents || []).find((item) => item.id === agentId) || null);
      setSources(knowledgeResponse.sources || []);
    } catch (requestError: any) {
      setError(requestError?.userMessage || requestError?.response?.data?.message || requestError?.message || "Unable to load knowledge.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [agentId]);

  function startCreate(type: AiKnowledgeSourceType = "faq") {
    setSelected(null);
    setDraft({ ...EMPTY_DRAFT, type });
  }

  function startEdit(source: AiKnowledgeSource) {
    setSelected(source);
    setDraft(normalizeForEdit(source));
  }

  function updateDraft(patch: Partial<AiKnowledgePayload>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function saveSource() {
    setSaving(true);
    try {
      if (selected) {
        const response = await aiAgentsApi.knowledge.update(agentId, selected.id, draft);
        toast("Knowledge source updated and indexed.", "success");
        setSelected(response.source);
        setDraft(normalizeForEdit(response.source));
      } else {
        const response = await aiAgentsApi.knowledge.create(agentId, draft);
        toast("Knowledge source added and indexed.", "success");
        setSelected(response.source);
        setDraft(normalizeForEdit(response.source));
      }
      await load();
    } catch (requestError: any) {
      toast(requestError?.userMessage || requestError?.response?.data?.message || requestError?.message || "Unable to save knowledge.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function uploadFile(file?: File | null) {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const response = await aiAgentsApi.knowledge.upload(agentId, file, setUploadProgress);
      toast("File uploaded and indexed.", "success");
      setSelected(response.source);
      setDraft(normalizeForEdit(response.source));
      await load();
    } catch (requestError: any) {
      toast(requestError?.userMessage || requestError?.response?.data?.message || requestError?.message || "Unable to upload file.", "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function removeSource(source: AiKnowledgeSource) {
    if (!window.confirm(`Delete "${source.title}" and all indexed chunks?`)) return;
    setSaving(true);
    try {
      await aiAgentsApi.knowledge.remove(agentId, source.id);
      toast("Knowledge source deleted.", "success");
      if (selected?.id === source.id) startCreate();
      await load();
    } catch (requestError: any) {
      toast(requestError?.userMessage || requestError?.response?.data?.message || requestError?.message || "Unable to delete knowledge.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function reindexSource(source: AiKnowledgeSource) {
    setSaving(true);
    try {
      await aiAgentsApi.knowledge.reindex(agentId, source.id);
      toast("Knowledge reindexed.", "success");
      await load();
    } catch (requestError: any) {
      toast(requestError?.userMessage || requestError?.response?.data?.message || requestError?.message || "Unable to reindex knowledge.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-7 p-4 md:p-8">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button type="button" onClick={() => navigate("/app/ai-agents")} className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-brand-600">
            <ArrowLeft size={15} />
            Back to AI Agents
          </button>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-600">
            <BookOpen size={17} />
            Production Knowledge Engine
          </div>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">{agent?.name || "AI Agent"} Knowledge</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            Manage FAQ, text, URL, and uploaded file knowledge. Sources are indexed into chunks and used by the AI runtime before any WhatsApp or Flow Builder integration.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Sync
          </Button>
          <Button onClick={() => startCreate()}>
            <Plus size={17} />
            Add Source
          </Button>
        </div>
      </section>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4">
              <div className="text-2xl font-black text-slate-900">{sources.length}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sources</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-black text-emerald-700">{stats.indexed}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Indexed</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-black text-brand-700">{stats.totalChunks}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chunks</div>
            </Card>
          </div>

          <div className="space-y-3">
            {loading ? [1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-[10px] bg-slate-200/70" />) : null}
            {!loading && sources.length === 0 ? (
              <Card className="p-6 text-center">
                <BookOpen size={28} className="mx-auto text-brand-600" />
                <h3 className="mt-3 font-black text-slate-900">No knowledge yet</h3>
                <p className="mt-2 text-sm font-medium text-slate-500">Add FAQ/text/URL sources or upload PDF, DOCX, CSV, TXT files.</p>
                <Button className="mt-4" onClick={() => startCreate()}>Add first source</Button>
              </Card>
            ) : null}
            {!loading && sources.map((source) => (
              <button
                type="button"
                key={source.id}
                onClick={() => startEdit(source)}
                className={`w-full rounded-[10px] border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${selected?.id === source.id ? "border-brand-400 ring-4 ring-brand-50" : "border-slate-200"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 rounded-[8px] bg-brand-50 p-2 text-brand-700">{sourceIcon(source.type)}</span>
                    <span>
                      <span className="block font-black text-slate-900">{source.title}</span>
                <span className="mt-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">{source.type} · {source.metadata?.totalChunks || 0} chunks</span>
                {source.metadata?.originalName ? <span className="mt-1 block text-[11px] font-semibold text-slate-400">{source.metadata.originalName}</span> : null}
                    </span>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${statusClass(source.status)}`}>{source.status}</span>
                </div>
                {source.metadata?.error ? <p className="mt-2 text-xs font-semibold text-rose-600">{source.metadata.error}</p> : null}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">{selected ? "Edit Knowledge Source" : "Add Knowledge Source"}</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Saving automatically reindexes chunks and removes stale chunks.</p>
              </div>
              {selected ? (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => void reindexSource(selected)} disabled={saving}>
                    <RefreshCw size={16} />
                    Reindex
                  </Button>
                  <Button variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => void removeSource(selected)} disabled={saving}>
                    <Trash2 size={16} />
                    Delete
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Select label="Source type" value={draft.type || "faq"} onChange={(event) => updateDraft({ type: event.target.value as AiKnowledgeSourceType })}>
                <option value="faq">FAQ</option>
                <option value="text">Plain Text</option>
                <option value="url">URL</option>
              </Select>
              <Input label="Title" value={draft.title || ""} onChange={(event) => updateDraft({ title: event.target.value })} placeholder="Pricing FAQ" />
            </div>

            <div className="mt-4 rounded-[12px] border border-dashed border-brand-200 bg-brand-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-black text-slate-900"><Upload size={16} /> Upload PDF / DOCX / CSV / TXT</div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Use this button for file knowledge. The dropdown above is only for manual FAQ, text, and URL sources.</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">Note: scanned/image-only PDFs need OCR and may not extract text.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] bg-brand-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-brand-700">
                  <Upload size={15} />
                  {uploading ? `Uploading ${uploadProgress || 0}%` : "Choose file"}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.csv,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,text/plain"
                    disabled={uploading || saving}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      void uploadFile(file);
                    }}
                  />
                </label>
              </div>
            </div>

            {draft.type === "faq" ? (
              <div className="mt-3 space-y-3">
                <Input label="Question" value={draft.question || ""} onChange={(event) => updateDraft({ question: event.target.value, title: event.target.value })} placeholder="What is your refund policy?" />
                <Textarea label="Answer" value={draft.answer || ""} onChange={(event) => updateDraft({ answer: event.target.value, content: event.target.value })} placeholder="Write the exact approved answer..." rows={8} />
              </div>
            ) : null}

            {draft.type === "text" ? (
              <div className="mt-3">
                <Textarea label="Content" value={draft.content || ""} onChange={(event) => updateDraft({ content: event.target.value })} placeholder="Paste business knowledge, policies, packages, FAQs..." rows={12} />
              </div>
            ) : null}

            {draft.type === "url" ? (
              <div className="mt-3 space-y-3">
                <Input label="Source URL" value={draft.sourceUrl || ""} onChange={(event) => updateDraft({ sourceUrl: event.target.value })} placeholder="https://example.com/pricing" />
                <Textarea label="Extracted text override (optional)" value={draft.content || ""} onChange={(event) => updateDraft({ content: event.target.value })} placeholder="Leave empty to fetch and extract page text automatically, or paste approved page text manually..." rows={12} />
              </div>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => startCreate(draft.type || "faq")}>Reset</Button>
              <Button onClick={() => void saveSource()} disabled={saving}>
                {saving ? "Saving..." : selected ? "Save & Reindex" : "Create & Index"}
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
