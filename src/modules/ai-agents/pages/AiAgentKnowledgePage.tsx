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
  searchBoost: 1,
  chunkSize: 900,
  maxChunks: 500,
  crawlPages: 1,
  crawlDepth: 0,
  metadata: {
    sectionKey: "faq",
    sectionLabel: "FAQ",
  },
};

type KnowledgeBlueprint = {
  key: string;
  label: string;
  type: AiKnowledgeSourceType;
  title: string;
  description: string;
  exampleTopic: string;
  recommendedFormat: string;
  questionPlaceholder?: string;
  answerPlaceholder?: string;
  contentPlaceholder?: string;
  sourceUrlPlaceholder?: string;
};

const KNOWLEDGE_BLUEPRINTS: KnowledgeBlueprint[] = [
  {
    key: "business_profile",
    label: "Business Profile",
    type: "text",
    title: "Business Profile",
    description: "Company intro, brand promise, location, audience, and what the business does.",
    exampleTopic: "Digital AdBird brand intro",
    recommendedFormat: "One business profile source",
    contentPlaceholder:
      "Business name, city, target audience, what the company does, why it is different, working hours, and brand promise. Keep this source only for business identity.",
  },
  {
    key: "services_products",
    label: "Services / Products",
    type: "text",
    title: "Services and Products",
    description: "One service family per source instead of mixing everything together.",
    exampleTopic: "Website Development",
    recommendedFormat: "One major service per source",
    contentPlaceholder:
      "Write one exact service only. Include who it is for, deliverables, process, timelines, and expected business outcome. Example topic: Website Development.",
  },
  {
    key: "faq",
    label: "FAQ",
    type: "faq",
    title: "FAQ",
    description: "Exact approved question-answer pairs for repeated customer asks.",
    exampleTopic: "What is Digital AdBird?",
    recommendedFormat: "One FAQ per source",
    questionPlaceholder: "What is Digital AdBird?",
    answerPlaceholder: "Write the exact approved answer in the brand tone. Keep it short, factual, and customer-friendly.",
  },
  {
    key: "industry_playbooks",
    label: "Industry Playbooks",
    type: "text",
    title: "Industry Playbook",
    description: "How your offer changes by industry like real estate, clinics, or ecommerce.",
    exampleTopic: "Real Estate Lead Funnel",
    recommendedFormat: "One industry strategy per source",
    contentPlaceholder:
      "Explain the exact strategy for one industry only. Include offer angle, funnel, ad channels, landing page logic, CRM or WhatsApp flow, and business outcome.",
  },
  {
    key: "objection_handling",
    label: "Objection Handling",
    type: "faq",
    title: "Objection Handling",
    description: "Approved answers for price, trust, ROI, and timing objections.",
    exampleTopic: "Why are your charges higher than others?",
    recommendedFormat: "One objection per source",
    questionPlaceholder: "Why are your charges higher than others?",
    answerPlaceholder:
      "Write the approved consultative reply. Address the objection, explain value, and move the user forward naturally.",
  },
  {
    key: "pricing_policy",
    label: "Pricing Policy",
    type: "text",
    title: "Pricing Policy",
    description: "Quote rules, ranges, discount rules, and when AI must escalate instead of guessing.",
    exampleTopic: "Meta Ads Management Pricing",
    recommendedFormat: "One pricing area per source",
    contentPlaceholder:
      "Include starting price, custom quote rules, what is included, what is excluded, and when AI must escalate to human instead of quoting.",
  },
  {
    key: "lead_qualification",
    label: "Lead Qualification",
    type: "text",
    title: "Lead Qualification Questions",
    description: "Discovery questions AI should ask before suggesting a service.",
    exampleTopic: "Real Estate qualification flow",
    recommendedFormat: "One qualification flow per audience",
    contentPlaceholder:
      "List the exact questions AI should ask, in order. Include what signals good fit, budget intent, urgency, and when to hand over to sales.",
  },
  {
    key: "escalation_rules",
    label: "Escalation Rules",
    type: "text",
    title: "Escalation Rules",
    description: "When AI must stop guessing and route the conversation to a human.",
    exampleTopic: "Pricing exception escalation",
    recommendedFormat: "One escalation policy per source",
    contentPlaceholder:
      "Define triggers for human handover: custom pricing, complaints, refunds, abusive language, legal requests, or uncertain answers.",
  },
  {
    key: "tone_language",
    label: "Tone / Language Examples",
    type: "text",
    title: "Tone and Language Examples",
    description: "Examples for Hindi, Henglish, and English style so replies feel human.",
    exampleTopic: "Henglish support tone",
    recommendedFormat: "One tone style per source",
    contentPlaceholder:
      "Give example replies in Hindi, Henglish, and English. Include greeting style, short answer style, follow-up style, and how to ask discovery questions naturally.",
  },
];

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

function draftFromBlueprint(blueprint: KnowledgeBlueprint): AiKnowledgePayload {
  return {
    ...EMPTY_DRAFT,
    type: blueprint.type,
    title: blueprint.title,
    question: blueprint.questionPlaceholder || "",
    answer: blueprint.answerPlaceholder || "",
    content: blueprint.type === "faq" ? blueprint.answerPlaceholder || "" : "",
    sourceUrl: blueprint.sourceUrlPlaceholder || "",
    metadata: {
      sectionKey: blueprint.key,
      sectionLabel: blueprint.label,
    },
  };
}

function normalizeForEdit(source: AiKnowledgeSource): AiKnowledgePayload {
  return {
    type: source.type,
    title: source.title || "",
    question: source.metadata?.question || source.title || "",
    answer: source.metadata?.answer || source.content || "",
    content: source.content || "",
    sourceUrl: source.sourceUrl || "",
    searchBoost: Number(source.metadata?.searchBoost || 1),
    chunkSize: Number(source.metadata?.chunkSize || 900),
    maxChunks: Number(source.metadata?.maxChunks || 500),
    crawlPages: Number(source.metadata?.crawlPages || 1),
    crawlDepth: Number(source.metadata?.crawlDepth || 0),
    metadata: {
      sectionKey: source.metadata?.sectionKey || "",
      sectionLabel: source.metadata?.sectionLabel || "",
    },
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
  const [knowledgeQuota, setKnowledgeQuota] = useState<any>(null);
  const [knowledgePolicy, setKnowledgePolicy] = useState<any>(null);
  const [duplicateTitles, setDuplicateTitles] = useState<Record<string, number>>({});

  const stats = useMemo(() => {
    const totalChunks = sources.reduce((sum, source) => sum + Number(source.metadata?.totalChunks || 0), 0);
    const indexed = sources.filter((source) => source.status === "indexed").length;
    const structured = sources.filter((source) => String(source.metadata?.sectionKey || "").trim()).length;
    return { totalChunks, indexed, structured };
  }, [sources]);

  const sectionCoverage = useMemo(
    () =>
      KNOWLEDGE_BLUEPRINTS.map((blueprint) => ({
        ...blueprint,
        count: sources.filter((source) => String(source.metadata?.sectionKey || "") === blueprint.key).length,
      })),
    [sources],
  );

  const selectedSectionKey = String((draft.metadata as any)?.sectionKey || "");
  const selectedBlueprint =
    KNOWLEDGE_BLUEPRINTS.find((item) => item.key === selectedSectionKey) ||
    KNOWLEDGE_BLUEPRINTS.find((item) => item.type === draft.type) ||
    KNOWLEDGE_BLUEPRINTS[0];

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
      setKnowledgeQuota(knowledgeResponse.quota || null);
      setKnowledgePolicy(knowledgeResponse.policy || null);
      setDuplicateTitles(knowledgeResponse.duplicates?.duplicateTitles || {});
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
    const blueprint = KNOWLEDGE_BLUEPRINTS.find((item) => item.type === type) || KNOWLEDGE_BLUEPRINTS[2];
    setDraft(draftFromBlueprint(blueprint));
  }

  function applyBlueprint(blueprint: KnowledgeBlueprint) {
    setSelected(null);
    setDraft(draftFromBlueprint(blueprint));
  }

  function startEdit(source: AiKnowledgeSource) {
    setSelected(source);
    setDraft(normalizeForEdit(source));
  }

  function updateDraft(patch: Partial<AiKnowledgePayload>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function updateSection(sectionKey: string) {
    const blueprint = KNOWLEDGE_BLUEPRINTS.find((item) => item.key === sectionKey);
    updateDraft({
      metadata: {
        ...(draft.metadata || {}),
        sectionKey,
        sectionLabel: blueprint?.label || "",
      },
    });
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
      const duplicateSourceTitle = requestError?.response?.data?.duplicateSource?.title;
      const duplicateMessage = duplicateSourceTitle ? `Duplicate detected. Existing source: ${duplicateSourceTitle}` : "";
      toast(duplicateMessage || requestError?.userMessage || requestError?.response?.data?.message || requestError?.message || "Unable to save knowledge.", "error");
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
            Structured Knowledge Builder
          </div>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">{agent?.name || "AI Agent"} Knowledge</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            Build a structured knowledge base with exact-topic sources. Prefer business profile, services, FAQ, pricing, objections, and industry playbooks over one giant PDF dump.
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
      <Alert tone="warn">
        Big PDF dump mat dalo. Best results tab milte hain jab ek source mein sirf ek exact topic ho, jaise <strong>Real Estate Lead Funnel</strong>, <strong>Website Development</strong>, ya <strong>Pricing Policy</strong>.
      </Alert>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-600">Structured Blueprint</div>
              <h2 className="mt-2 text-xl font-black text-slate-900">Customer knowledge dashboard sections</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Use these ready-made blocks so every customer sets up AI knowledge in a clean, industry-standard format.</p>
            </div>
            <div className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-brand-700">
              One topic per source
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sectionCoverage.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => applyBlueprint(section)}
                className="rounded-[14px] border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-slate-900">{section.label}</div>
                    <div className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{section.recommendedFormat}</div>
                  </div>
                  <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                    {section.count} added
                  </div>
                </div>
                <p className="mt-3 text-xs font-medium leading-5 text-slate-500">{section.description}</p>
                <div className="mt-3 text-[11px] font-semibold text-brand-700">Example: {section.exampleTopic}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Build Rules</div>
          <div className="mt-3 space-y-3">
            <div className="rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-sm font-black text-slate-900">1 source = 1 exact topic</div>
              <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">Do not mix website, SEO, ads, funnels, pricing, and objections inside one text block.</div>
            </div>
            <div className="rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-sm font-black text-slate-900">Use text and FAQ first</div>
              <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">Manual text and FAQ are easier to control than raw file dumps and give cleaner live replies.</div>
            </div>
            <div className="rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-sm font-black text-slate-900">Store tone examples separately</div>
              <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">Keep Hindi, Henglish, and English examples in their own tone section instead of mixing them into product docs.</div>
            </div>
          </div>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
            <Card className="p-4">
              <div className="text-2xl font-black text-slate-900">{stats.structured}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Structured</div>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black text-slate-900">Workspace KB Quota</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  {knowledgeQuota?.workspaceUsedMb || 0} MB used / {knowledgeQuota?.workspaceQuotaMb || 0} MB
                </div>
              </div>
              <div className="text-right text-xs font-black uppercase text-slate-400">
                {knowledgeQuota?.workspaceRemainingMb || 0} MB left
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-brand-600"
                style={{
                  width: `${Math.min(100, Math.max(0, ((Number(knowledgeQuota?.workspaceUsedBytes || 0) / Math.max(1, Number(knowledgeQuota?.workspaceQuotaBytes || 1))) * 100)))}%`,
                }}
              />
            </div>
          </Card>

          <div className="space-y-3">
            {loading ? [1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-[10px] bg-slate-200/70" />) : null}
            {!loading && sources.length === 0 ? (
              <Card className="p-6 text-center">
                <BookOpen size={28} className="mx-auto text-brand-600" />
                <h3 className="mt-3 font-black text-slate-900">No knowledge yet</h3>
                <p className="mt-2 text-sm font-medium text-slate-500">Start with business profile, one service, one pricing policy, and 3-5 FAQ sources.</p>
                <Button className="mt-4" onClick={() => applyBlueprint(KNOWLEDGE_BLUEPRINTS[0])}>Start Structured Setup</Button>
              </Card>
            ) : null}
            {!loading &&
              sources.map((source) => (
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
                        <span className="mt-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {source.metadata?.sectionLabel || source.type} · {source.metadata?.totalChunks || 0} chunks
                        </span>
                        {source.metadata?.originalName ? <span className="mt-1 block text-[11px] font-semibold text-slate-400">{source.metadata.originalName}</span> : null}
                      </span>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${statusClass(source.status)}`}>{source.status}</span>
                  </div>
                  {source.metadata?.error ? <p className="mt-2 text-xs font-semibold text-rose-600">{source.metadata.error}</p> : null}
                  {(duplicateTitles[String(source.title || "").trim().toLowerCase()] || 0) > 1 ? (
                    <p className="mt-2 text-xs font-semibold text-amber-600">Duplicate title group: {duplicateTitles[String(source.title || "").trim().toLowerCase()]} sources</p>
                  ) : null}
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

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Select
                label="Knowledge section"
                value={selectedSectionKey}
                onChange={(event) => updateSection(event.target.value)}
              >
                {KNOWLEDGE_BLUEPRINTS.map((section) => (
                  <option key={section.key} value={section.key}>
                    {section.label}
                  </option>
                ))}
              </Select>
              <Select
                label="Source type"
                value={draft.type || "faq"}
                onChange={(event) => updateDraft({ type: event.target.value as AiKnowledgeSourceType })}
              >
                <option value="faq">FAQ</option>
                <option value="text">Plain Text</option>
                <option value="url">URL</option>
              </Select>
              <Input
                label="Title"
                value={draft.title || ""}
                onChange={(event) => updateDraft({ title: event.target.value })}
                placeholder={selectedBlueprint?.title || "Pricing Policy"}
              />
            </div>

            <div className="mt-4 rounded-[12px] border border-brand-200 bg-brand-50/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-slate-900">{selectedBlueprint?.label || "Knowledge"} blueprint</div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{selectedBlueprint?.description}</p>
                  <p className="mt-2 text-[11px] font-semibold text-brand-700">Example exact topic: {selectedBlueprint?.exampleTopic}</p>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-brand-700">
                  {selectedBlueprint?.recommendedFormat}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[12px] border border-dashed border-brand-200 bg-brand-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-black text-slate-900"><Upload size={16} /> Upload PDF / DOCX / CSV / TXT</div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Use file upload for supporting docs only. Primary business knowledge should still be structured as text or FAQ topics.</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">Note: scanned or image-only PDFs need OCR and may not extract text correctly.</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">
                    Limits: {(knowledgePolicy?.maxUploadBytes || 0) / (1024 * 1024)} MB max file, URL ingest is single-page only, max {knowledgePolicy?.maxUrlSourcesPerAgent || 0} URL sources per agent.
                  </p>
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
                <Input
                  label="Question"
                  value={draft.question || ""}
                  onChange={(event) => updateDraft({ question: event.target.value, title: event.target.value })}
                  placeholder={selectedBlueprint?.questionPlaceholder || "What is your refund policy?"}
                />
                <Textarea
                  label="Answer"
                  value={draft.answer || ""}
                  onChange={(event) => updateDraft({ answer: event.target.value, content: event.target.value })}
                  placeholder={selectedBlueprint?.answerPlaceholder || "Write the exact approved answer..."}
                  rows={8}
                />
              </div>
            ) : null}

            {draft.type === "text" ? (
              <div className="mt-3">
                <Textarea
                  label="Content"
                  value={draft.content || ""}
                  onChange={(event) => updateDraft({ content: event.target.value })}
                  placeholder={selectedBlueprint?.contentPlaceholder || "Paste one exact topic only..."}
                  rows={12}
                />
              </div>
            ) : null}

            {draft.type === "url" ? (
              <div className="mt-3 space-y-3">
                <Input
                  label="Source URL"
                  value={draft.sourceUrl || ""}
                  onChange={(event) => updateDraft({ sourceUrl: event.target.value })}
                  placeholder={selectedBlueprint?.sourceUrlPlaceholder || "https://example.com/pricing"}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Crawl pages" type="number" value={Number(draft.crawlPages || 1)} onChange={(event) => updateDraft({ crawlPages: Number(event.target.value) })} />
                  <Input label="Crawl depth" type="number" value={Number(draft.crawlDepth || 0)} onChange={(event) => updateDraft({ crawlDepth: Number(event.target.value) })} />
                </div>
                <Textarea
                  label="Extracted text override (optional)"
                  value={draft.content || ""}
                  onChange={(event) => updateDraft({ content: event.target.value })}
                  placeholder="Leave empty to fetch and extract page text automatically, or paste approved page text manually..."
                  rows={12}
                />
              </div>
            ) : null}

            <div className="mt-4 rounded-[12px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-900">Chunking & Search Controls</div>
              <p className="mt-1 text-xs font-semibold text-slate-500">Tune how the source is split and how strongly it ranks during search.</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <Input label="Chunk size" type="number" value={Number(draft.chunkSize || 900)} onChange={(event) => updateDraft({ chunkSize: Number(event.target.value) })} />
                <Input label="Max chunks" type="number" value={Number(draft.maxChunks || 500)} onChange={(event) => updateDraft({ maxChunks: Number(event.target.value) })} />
                <Input label="Search boost" type="number" step="0.1" value={Number(draft.searchBoost || 1)} onChange={(event) => updateDraft({ searchBoost: Number(event.target.value) })} />
              </div>
              <div className="mt-2 text-[11px] font-semibold text-slate-400">
                Allowed ranges: chunk size {knowledgePolicy?.chunking?.minChunkSize || 100}-{knowledgePolicy?.chunking?.maxChunkSize || 2000}, max chunks up to {knowledgePolicy?.chunking?.maxChunksPerSource || 1000}, search boost {knowledgePolicy?.ranking?.minSearchBoost || 0}-{knowledgePolicy?.ranking?.maxSearchBoost || 10}.
              </div>
            </div>

            <div className="mt-4 rounded-[12px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-900">Best practice for this source</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs font-semibold leading-5 text-slate-500">
                <li>Keep this source focused on one exact topic only.</li>
                <li>Use approved business language, not brainstorming notes.</li>
                <li>If this source needs a different customer intent, create a new source instead of expanding this one.</li>
              </ul>
            </div>

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
