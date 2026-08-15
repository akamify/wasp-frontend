import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Coins,
  CreditCard,
  Sparkles,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  ShieldX,
  SlidersHorizontal,
  Trash2,
  Wallet,
  Wrench,
  LockOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import { Select } from "@components/ui/Select";
import { Textarea } from "@components/ui/Textarea";
import { API } from "@api/api";
import { useToast } from "@shared/providers/ToastContext";
import { cn } from "@shared/utils/cn";
import { aiAgentsApi } from "@modules/ai-agents/aiAgentsApi";
import { ConversationWorkspace } from "@modules/conversations/views/ConversationWorkspace";
import type {
  AiAddonStatusResponse,
  AiAgent,
  AiAgentPayload,
  AiAgentSendButtonConfig,
  AiAgentStatus,
  AiBillingStatementItem,
  AiBillingSummaryResponse,
  AiBillingTimelineResponse,
  AiBudgetStatusResponse,
  AiAgentToolType,
  AiCreditTransaction,
  AiDashboardResponse,
  AiUsageAnalyticsResponse,
  AiUsageExplorerResponse,
} from "@modules/ai-agents/types";

type AiTabKey = "overview" | "agents" | "conversations" | "usage" | "billing" | "settings";
type AutomationFlowOption = { _id?: string; id?: string; name: string; status?: string };

const TOOL_OPTIONS: Array<{ type: AiAgentToolType; label: string; description: string }> = [
  { type: "crm_lookup", label: "CRM lookup", description: "Read lead/contact context before answering." },
  { type: "contact_update", label: "Contact update", description: "Update basic contact profile fields." },
  { type: "set_tag", label: "Set tag", description: "Apply tags like qualified or support." },
  { type: "set_attribute", label: "Set attribute", description: "Save structured contact attributes." },
  { type: "api_request", label: "API request", description: "Call external systems later through tool config." },
  { type: "handover", label: "Human handover", description: "Transfer to inbox/CRM team when needed." },
  { type: "send_buttons", label: "WhatsApp buttons", description: "Send approved buttons that start automation flows." },
];

const TABS: Array<{ key: AiTabKey; label: string; icon: React.ReactNode }> = [
  { key: "overview", label: "Overview", icon: <BarChart3 size={15} /> },
  { key: "agents", label: "Agents", icon: <Bot size={15} /> },
  { key: "conversations", label: "Conversations", icon: <MessageCircle size={15} /> },
  { key: "usage", label: "Usage", icon: <BrainCircuit size={15} /> },
  { key: "billing", label: "Billing", icon: <Wallet size={15} /> },
  { key: "settings", label: "Settings", icon: <Settings2 size={15} /> },
];

const DEFAULT_AGENT: AiAgentPayload = {
  name: "",
  description: "",
  status: "draft",
  persona: "support",
  modelProvider: "gemini",
  modelName: "gemini-3.5-flash",
  systemPrompt:
    "You are a helpful WhatsApp assistant. Answer only from configured business knowledge. If unsure, ask a clarifying question or hand over to a human.",
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
    confidenceThreshold: 0.55,
    allowedTopics: [],
    blockedTopics: [],
  },
  runtimeControls: {
    businessHours: {
      enabled: false,
      timezone: "Asia/Calcutta",
      days: ["mon", "tue", "wed", "thu", "fri", "sat"],
      startTime: "09:00",
      endTime: "18:00",
      afterHoursAction: "reply_and_handover",
    },
    escalationRules: {
      enabled: false,
      keywords: [],
      slaMinutes: 30,
      action: "handover",
    },
    conversationSla: {
      enabled: false,
      firstResponseMinutes: 15,
    },
    fallbackTemplates: {
      afterHours: "",
      escalation: "",
      noAnswer: "",
    },
    routing: {
      keywords: [],
      priority: 100,
      channels: ["whatsapp", "test", "api"],
    },
  },
  metadata: {
    managedFileSearch: {
      enabled: true,
    },
  },
};

function csvToList(value: string) {
  return Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean)));
}

function listToCsv(value?: string[]) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function flowOptionId(flow: AutomationFlowOption) {
  return String(flow._id || flow.id || "").trim();
}

function sendButtonsConfig(agent: AiAgentPayload) {
  const tool = (agent.tools || []).find((item) => item.type === "send_buttons");
  const config = tool?.config && typeof tool.config === "object" ? tool.config as { defaultBody?: string; buttons?: AiAgentSendButtonConfig[] } : {};
  return {
    defaultBody: String(config.defaultBody || ""),
    buttons: Array.isArray(config.buttons) ? config.buttons : [],
  };
}

function getReplyPolicyPreview(agent?: AiAgentPayload | AiAgent | null) {
  const handoverOnLowConfidence = agent?.guardrails?.handoverOnLowConfidence !== false;
  const fallbackMessage = String(agent?.guardrails?.fallbackMessage || "").trim() || DEFAULT_AGENT.guardrails?.fallbackMessage || "";
  const afterHoursAction = String(agent?.runtimeControls?.businessHours?.afterHoursAction || "reply_and_handover");
  const channels = Array.isArray(agent?.runtimeControls?.routing?.channels) && agent?.runtimeControls?.routing?.channels?.length
    ? agent?.runtimeControls?.routing?.channels
    : ["whatsapp", "test", "api"];

  return {
    language: "Auto mirror: Hinglish -> Hinglish, हिंदी -> हिंदी, English -> English",
    shortReply: "Short message -> 1 to 2 lines only",
    detailedReply: "Detailed business query -> concise explanation + short bullets + one useful follow-up question",
    disclosure: "Natural assistant tone, but never claims to be human",
    followUp: "Only one useful next question in the whole reply",
    escalation: handoverOnLowConfidence ? "Low confidence -> handover / fallback reply" : "Low confidence handover off",
    fallbackMessage,
    afterHours:
      afterHoursAction === "handover_only"
        ? "After hours -> direct handover"
        : afterHoursAction === "pause"
          ? "After hours -> AI paused"
          : "After hours -> reply, then handover if needed",
    channels: channels.join(", "),
  };
}

function humanizeRuntimeReason(value?: string | null) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized
    .split(/[_:]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeEditable(agent?: AiAgent | null): AiAgentPayload {
  if (!agent) return structuredClone(DEFAULT_AGENT);
  return {
    name: agent.name,
    slug: agent.slug,
    description: agent.description,
    status: agent.status,
    persona: agent.persona,
    modelProvider: "gemini",
    modelName: agent.modelName || "gemini-3.5-flash",
    systemPrompt: agent.systemPrompt,
    language: agent.language,
    temperature: agent.temperature,
    knowledgeSources: agent.knowledgeSources || [],
    tools: agent.tools || [],
    guardrails: agent.guardrails || DEFAULT_AGENT.guardrails,
    runtimeControls: agent.runtimeControls || DEFAULT_AGENT.runtimeControls,
    metadata: agent.metadata || DEFAULT_AGENT.metadata,
  };
}

function getManagedFileSearchState(agent?: AiAgent | null) {
  const managed = agent?.metadata?.managedFileSearch;
  const enabled = managed?.enabled !== false;
  const hasStore = Boolean(String(managed?.storeName || "").trim());
  const documentCount = Math.max(0, Number(managed?.documentCount || 0));
  const lastError = String(managed?.lastError || "").trim();
  const rawStatus = String(managed?.status || "").trim().toLowerCase();
  const status =
    rawStatus ||
    (enabled ? (hasStore ? "ready" : documentCount > 0 ? "syncing" : "idle") : "disabled");

  let syncLabel = "Waiting";
  let tone: "ok" | "warn" | "error" = "warn";
  if (!enabled) {
    syncLabel = "Off";
  } else if (status === "ready") {
    syncLabel = "Synced";
    tone = "ok";
  } else if (status === "degraded") {
    syncLabel = "Degraded";
    tone = "warn";
  } else if (status === "failed") {
    syncLabel = "Failed";
    tone = "error";
  } else if (status === "syncing" || status === "recreating") {
    syncLabel = "Syncing";
  } else if (status === "disabled") {
    syncLabel = "Off";
  }

  return {
    enabled,
    hasStore,
    documentCount,
    lastError,
    status,
    syncLabel,
    tone,
    storeStatus: !enabled ? "Disabled" : hasStore ? "Ready" : "Not created",
    syncedAt: managed?.syncedAt || null,
    displayName: String(managed?.displayName || "").trim(),
    embeddingModel: String(managed?.embeddingModel || "").trim(),
  };
}

export default function AiAgentsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tab, setTab] = useState<AiTabKey>("overview");
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [dashboard, setDashboard] = useState<AiDashboardResponse | null>(null);
  const [addonStatus, setAddonStatus] = useState<AiAddonStatusResponse | null>(null);
  const [transactions, setTransactions] = useState<AiCreditTransaction[]>([]);
  const [billingSummary, setBillingSummary] = useState<AiBillingSummaryResponse | null>(null);
  const [billingStatements, setBillingStatements] = useState<AiBillingStatementItem[]>([]);
  const [billingTimeline, setBillingTimeline] = useState<AiBillingTimelineResponse["items"]>([]);
  const [budgetStatus, setBudgetStatus] = useState<AiBudgetStatusResponse | null>(null);
  const [usageAnalytics, setUsageAnalytics] = useState<AiUsageAnalyticsResponse | null>(null);
  const [usageExplorer, setUsageExplorer] = useState<AiUsageExplorerResponse | null>(null);
  const [budgetDraft, setBudgetDraft] = useState({
    monthlyCreditBudget: "0",
    monthlyCreditWarning: "0",
    lowCreditWarning: "0",
    nearExhaustionWarning: "0",
    notificationsEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AiAgentStatus | "">("");
  const [selected, setSelected] = useState<AiAgent | null>(null);
  const [draft, setDraft] = useState<AiAgentPayload>(() => structuredClone(DEFAULT_AGENT));
  const [topupOpen, setTopupOpen] = useState(false);
  const [purchasingPackId, setPurchasingPackId] = useState("");
  const [analyticsDateFrom, setAnalyticsDateFrom] = useState(() => toDateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [analyticsDateTo, setAnalyticsDateTo] = useState(() => toDateInputValue(new Date()));
  const [analyticsAgentId, setAnalyticsAgentId] = useState("");
  const [analyticsChannel, setAnalyticsChannel] = useState<"all" | "test" | "whatsapp" | "api">("all");
  const [conversationPhone, setConversationPhone] = useState("");
  const [conversationAgentId, setConversationAgentId] = useState("");
  const [conversationAiState, setConversationAiState] = useState("");
  const [automationFlows, setAutomationFlows] = useState<AutomationFlowOption[]>([]);
  const [automationFlowsLoading, setAutomationFlowsLoading] = useState(false);

  const filteredAgents = useMemo(() => agents, [agents]);
  const usageTransactions = useMemo(() => transactions.filter((item) => item.type === "usage"), [transactions]);

  async function loadAgents() {
    try {
      const response = await aiAgentsApi.list({ search: search.trim(), status, page: 1, limit: 100 });
      setAgents(response.agents || []);
      if (selected) {
        const refreshed = (response.agents || []).find((agent) => agent.id === selected.id) || null;
        setSelected(refreshed);
      }
    } catch (requestError: any) {
      setError(requestError?.userMessage || requestError?.response?.data?.message || requestError?.message || "Unable to load AI agents.");
    }
  }

  async function loadShell() {
    setLoading(true);
    setError("");
    try {
      const queryFilters = {
        dateFrom: analyticsDateFrom || undefined,
        dateTo: analyticsDateTo || undefined,
        agentId: analyticsAgentId || undefined,
        channel: analyticsChannel,
      };
      const [dashboardResponse, transactionsResponse, agentsResponse, billingSummaryResponse, statementsResponse, timelineResponse, budgetResponse, usageAnalyticsResponse, usageExplorerResponse] = await Promise.all([
        aiAgentsApi.dashboard({
          ...queryFilters,
        }),
        aiAgentsApi.addonTransactions({ limit: 10 }),
        aiAgentsApi.list({ search: search.trim(), status, page: 1, limit: 100 }),
        aiAgentsApi.billingSummary(queryFilters),
        aiAgentsApi.billingStatements({ limit: 4 }),
        aiAgentsApi.billingTimeline(queryFilters),
        aiAgentsApi.billingBudget(),
        aiAgentsApi.billingAnalytics(queryFilters),
        aiAgentsApi.billingUsageExplorer({ ...queryFilters, page: 1, limit: 8 }),
      ]);
      setDashboard(dashboardResponse);
      setAddonStatus(dashboardResponse.billing);
      setTransactions(transactionsResponse.transactions || []);
      setAgents(agentsResponse.agents || []);
      setBillingSummary(billingSummaryResponse);
      setBillingStatements(statementsResponse.items || []);
      setBillingTimeline(timelineResponse.items || []);
      setBudgetStatus(budgetResponse);
      setUsageAnalytics(usageAnalyticsResponse);
      setUsageExplorer(usageExplorerResponse);
      setBudgetDraft({
        monthlyCreditBudget: String(budgetResponse?.config?.monthlyCreditBudget ?? 0),
        monthlyCreditWarning: String(budgetResponse?.config?.monthlyCreditWarning ?? 0),
        lowCreditWarning: String(budgetResponse?.config?.lowCreditWarning ?? 0),
        nearExhaustionWarning: String(budgetResponse?.config?.nearExhaustionWarning ?? 0),
        notificationsEnabled: budgetResponse?.config?.notificationsEnabled !== false,
      });
      if (selected) {
        const refreshed = (agentsResponse.agents || []).find((agent) => agent.id === selected.id) || null;
        setSelected(refreshed);
      }
    } catch (requestError: any) {
      setError(requestError?.userMessage || requestError?.response?.data?.message || requestError?.message || "Unable to load AI module.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAgents(), 250);
    return () => window.clearTimeout(timer);
  }, [search, status]);

  useEffect(() => {
    void loadShell();
  }, [analyticsDateFrom, analyticsDateTo, analyticsAgentId, analyticsChannel]);

  useEffect(() => {
    if (!isAgentModalOpen) return;
    let active = true;
    setAutomationFlowsLoading(true);
    API.automationFlows
      .list({ status: "active", page: 1, limit: 100 })
      .then((rawResponse) => {
        if (!active) return;
        const response = rawResponse as { flows?: AutomationFlowOption[] };
        setAutomationFlows(Array.isArray(response.flows) ? response.flows : []);
      })
      .catch(() => {
        if (active) setAutomationFlows([]);
      })
      .finally(() => {
        if (active) setAutomationFlowsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAgentModalOpen]);

  function startCreate() {
    setSelected(null);
    setDraft(structuredClone(DEFAULT_AGENT));
    setTab("agents");
    setIsAgentModalOpen(true);
  }

  function startEdit(agent: AiAgent) {
    setSelected(agent);
    setDraft(normalizeEditable(agent));
    setTab("agents");
    setIsAgentModalOpen(true);
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

  function updateToolConfig(type: AiAgentToolType, config: Record<string, unknown>) {
    const tools = [...(draft.tools || [])];
    const index = tools.findIndex((tool) => tool.type === type);
    if (index >= 0) tools[index] = { ...tools[index], config };
    else tools.push({ type, enabled: true, config });
    updateDraft({ tools });
  }

  function updateSendButtonsConfig(patch: Partial<{ defaultBody: string; buttons: AiAgentSendButtonConfig[] }>) {
    const current = sendButtonsConfig(draft);
    updateToolConfig("send_buttons", {
      defaultBody: patch.defaultBody ?? current.defaultBody,
      buttons: patch.buttons ?? current.buttons,
    });
  }

  function updateSendButton(index: number, patch: Partial<AiAgentSendButtonConfig>) {
    const current = sendButtonsConfig(draft);
    const buttons = current.buttons.map((button, buttonIndex) => buttonIndex === index ? { ...button, ...patch } : button);
    updateSendButtonsConfig({ buttons });
  }

  function addSendButton() {
    const current = sendButtonsConfig(draft);
    updateSendButtonsConfig({
      buttons: [
        ...current.buttons,
        { id: `option_${current.buttons.length + 1}`, title: `Option ${current.buttons.length + 1}`, flowId: "" },
      ],
    });
  }

  function removeSendButton(index: number) {
    const current = sendButtonsConfig(draft);
    updateSendButtonsConfig({ buttons: current.buttons.filter((_, buttonIndex) => buttonIndex !== index) });
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
      setIsAgentModalOpen(false);
      await loadShell();
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
      await loadShell();
    } catch (requestError: any) {
      toast(requestError?.userMessage || requestError?.response?.data?.message || requestError?.message || "Unable to delete AI agent.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleManagedFileSearch(agent: AiAgent, enabled: boolean) {
    setSaving(true);
    try {
      const response = await aiAgentsApi.update(agent.id, {
        metadata: {
          managedFileSearch: {
            enabled,
          },
        },
      });
      setSelected(response.agent);
      setDraft(normalizeEditable(response.agent));
      toast(enabled ? "Managed File Search enabled." : "Managed File Search turned off.", "success");
      await loadShell();
    } catch (requestError: any) {
      toast(
        requestError?.userMessage ||
          requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to update Managed File Search.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function purchaseTopup(packId: string) {
    setPurchasingPackId(packId);
    try {
      const response = await aiAgentsApi.purchaseTopup({ packId });
      setAddonStatus(response);
      toast(response.message || "AI credits added.", "success");
      setTopupOpen(false);
      await loadShell();
    } catch (requestError: any) {
      toast(requestError?.response?.data?.message || requestError?.message || "Unable to purchase AI top-up.", "error");
    } finally {
      setPurchasingPackId("");
    }
  }

  async function saveBudgetSettings() {
    setSaving(true);
    try {
      const response = await aiAgentsApi.updateBillingBudget({
        monthlyCreditBudget: Number(budgetDraft.monthlyCreditBudget || 0),
        monthlyCreditWarning: Number(budgetDraft.monthlyCreditWarning || 0),
        lowCreditWarning: Number(budgetDraft.lowCreditWarning || 0),
        nearExhaustionWarning: Number(budgetDraft.nearExhaustionWarning || 0),
        notificationsEnabled: budgetDraft.notificationsEnabled,
      });
      setBudgetStatus(response);
      toast("AI budget settings saved.", "success");
      await loadShell();
    } catch (requestError: any) {
      toast(requestError?.response?.data?.message || requestError?.message || "Unable to save AI budget settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function downloadStatement(periodKey: string) {
    try {
      const blob = await aiAgentsApi.billingStatementDownload(periodKey);
      downloadBlob(blob, `ai-billing-statement-${periodKey}.csv`);
    } catch (requestError: any) {
      toast(requestError?.response?.data?.message || requestError?.message || "Unable to download billing statement.", "error");
    }
  }

  async function downloadBillingReport(reportType: string) {
    try {
      const blob = await aiAgentsApi.billingReportDownload({
        reportType,
        dateFrom: analyticsDateFrom || undefined,
        dateTo: analyticsDateTo || undefined,
      });
      downloadBlob(blob, `${reportType}.csv`);
    } catch (requestError: any) {
      toast(requestError?.response?.data?.message || requestError?.message || "Unable to download billing report.", "error");
    }
  }

  const overview = dashboard?.overview;
  const liveRuntime: any = dashboard?.liveRuntime || null;
  const usageBreakdown = dashboard?.usageBreakdown;
  const selectedAgentName = agents.find((agent) => agent.id === analyticsAgentId)?.name || "All agents";
  const modelOptions = dashboard?.settings.availableModels?.length
    ? dashboard.settings.availableModels
    : [{ key: dashboard?.settings.modelDefault || "gemini-3.5-flash", label: dashboard?.settings.modelDefault || "Gemini 3.5 Flash" }];
  const billingAlerts = budgetStatus?.status.alerts || [];
  const heroPlanName = addonStatus?.subscription?.planName || "AI Agent Add-on";
  const heroRemainingCredits = Number(addonStatus?.workspace.remainingCredits || 0);
  const heroRemainingTokens = Number(addonStatus?.workspace.remainingTokens || 0);
  const heroTodayReplies = Number(overview?.usage.todayReplies || 0);
  const heroKnowledgeSources = Number(overview?.knowledge.totalSources || 0);
  const managedFileSearch = getManagedFileSearchState(selected);
  const setQuickRange = (preset: "today" | "7d" | "month") => {
    const now = new Date();
    if (preset === "today") {
      const today = toDateInputValue(now);
      setAnalyticsDateFrom(today);
      setAnalyticsDateTo(today);
      return;
    }
    if (preset === "7d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      setAnalyticsDateFrom(toDateInputValue(start));
      setAnalyticsDateTo(toDateInputValue(now));
      return;
    }
    setAnalyticsDateFrom(toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)));
    setAnalyticsDateTo(toDateInputValue(now));
  };

  async function handleReturnConversationToAi(phone: string) {
    try {
      await API.conversations.returnToAi(phone, { reason: "ai_agents_dashboard_return" });
      toast("Conversation returned to AI.", "success");
      await loadShell();
    } catch (requestError: any) {
      toast(requestError?.response?.data?.message || requestError?.message || "Unable to return conversation to AI.", "error");
    }
  }

  async function handleReleaseFlowBlock(phone: string) {
    try {
      await API.conversations.releaseFlowBlock(phone, { reason: "ai_agents_dashboard_flow_release" });
      toast("Flow block released. AI can resume on the next inbound message.", "success");
      await loadShell();
    } catch (requestError: any) {
      toast(requestError?.response?.data?.message || requestError?.message || "Unable to release flow block.", "error");
    }
  }

  return (
    <div className="space-y-8 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_24%),linear-gradient(180deg,_rgba(248,250,252,0.96),_rgba(255,255,255,1))] p-4 md:p-8">
      <section className="space-y-4">
        <Card className="border border-emerald-100/80 bg-[linear-gradient(135deg,_#0f172a_0%,_#12324d_55%,_#0f766e_100%)] p-6 text-white shadow-[0_30px_80px_-34px_rgba(8,18,38,0.78)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.26em] text-emerald-100">AI Agents</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">AI agent workspace</h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <HeroStatCard label="Current plan" value={heroPlanName} helper="billing active" />
              <HeroStatCard label="Available credits" value={String(heroRemainingCredits)} helper={`${heroRemainingTokens} tokens`} />
              <HeroStatCard label="Today's replies" value={String(heroTodayReplies)} helper={`${heroKnowledgeSources} sources`} />
            </div>
          </div>
        </Card>

        <Card className="border border-white/80 bg-white/92 p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Workspace Controls</div>
              <div className="mt-2 text-xl font-black text-slate-900">Manage agents, tokens, and usage</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void loadShell()} className="justify-center border-slate-200 bg-white">
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </Button>
              <Button variant="outline" onClick={() => setTopupOpen(true)} className="justify-center border-slate-200 bg-white">
                <CreditCard size={16} />
                Top-up
              </Button>
              <Button onClick={startCreate} className="justify-center shadow-lg shadow-emerald-500/20">
                <Plus size={17} />
                New Agent
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <Card className="border border-slate-200 bg-slate-50/80 p-4 shadow-none">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Tracked Conversations</div>
              <div className="mt-3 text-2xl font-black text-slate-900">{String(dashboard?.overview.conversationCounts.total || 0)}</div>
            </Card>
            <Card className="border border-slate-200 bg-slate-50/80 p-4 shadow-none">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Credits Used</div>
              <div className="mt-3 text-2xl font-black text-slate-900">{formatCredits(usageBreakdown?.creditsUsedMonth || 0)}</div>
            </Card>
            <Card className="border border-slate-200 bg-slate-50/80 p-4 shadow-none">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Resolution Rate</div>
              <div className="mt-3 text-2xl font-black text-slate-900">{formatPercent(overview?.usage.resolutionRate || 0)}</div>
            </Card>
            <Card className="border border-slate-200 bg-slate-50/80 p-4 shadow-none">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Included Tokens</div>
              <div className="mt-3 text-2xl font-black text-slate-900">{Number(addonStatus?.subscription?.includedTokensPerCycle || 0)}</div>
            </Card>
            <Card className="border border-slate-200 bg-slate-50/80 p-4 shadow-none">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Remaining Tokens</div>
              <div className="mt-3 text-2xl font-black text-slate-900">{Number(addonStatus?.workspace.remainingTokens || 0)}</div>
            </Card>
            <Card className="border border-slate-200 bg-slate-50/80 p-4 shadow-none">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Top-up Tokens</div>
              <div className="mt-3 text-2xl font-black text-slate-900">{Number(addonStatus?.subscription?.remainingTopupTokens || 0)}</div>
            </Card>
          </div>
        </Card>
      </section>

      {false && (
        <>
      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className="relative overflow-hidden border border-emerald-100/80 bg-[linear-gradient(135deg,_#081226_0%,_#143352_56%,_#0f766e_100%)] p-6 text-white shadow-[0_30px_80px_-34px_rgba(8,18,38,0.78)] md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.22),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.18),_transparent_28%)]" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.26em] text-emerald-100">
                <Sparkles size={14} />
                AI Agent Marketplace
              </div>
              <div>
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-5xl">
                  Launch, monitor, and scale AI agents from one polished workspace.
                </h1>
                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-200/88 md:text-[15px]">
                  A single command center for live conversations, runtime health, credit burn, and billing visibility with a cleaner marketplace-style experience.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HeroStatCard label="Current plan" value={heroPlanName} helper="Recurring AI billing active" />
              <HeroStatCard label="Available credits" value={String(heroRemainingCredits)} helper={`${heroRemainingTokens} tokens ready`} />
              <HeroStatCard label="Today’s replies" value={String(heroTodayReplies)} helper={`${heroKnowledgeSources} knowledge sources connected`} />
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="border border-white/80 bg-white/90 p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Workspace controls</div>
                <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">Operate like a premium AI storefront</div>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  Create new agents, top up instantly, and keep data views fresh while you manage runtime activity.
                </p>
              </div>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
                Live control
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Button variant="outline" onClick={() => void loadShell()} className="justify-center border-slate-200 bg-white">
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </Button>
              <Button variant="outline" onClick={() => setTopupOpen(true)} className="justify-center border-slate-200 bg-white">
                <CreditCard size={16} />
                Top-up
              </Button>
              <Button onClick={startCreate} className="justify-center shadow-lg shadow-emerald-500/20">
                <Plus size={17} />
                New Agent
              </Button>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border border-white/80 bg-white/90 p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                  <MessageCircle size={18} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Live</span>
              </div>
              <div className="mt-4 text-2xl font-black text-slate-900">{String(dashboard?.overview.conversationCounts.total || 0)}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">Tracked AI conversations</div>
            </Card>
            <Card className="border border-white/80 bg-white/90 p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                  <Coins size={18} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Burn</span>
              </div>
              <div className="mt-4 text-2xl font-black text-slate-900">{formatCredits(usageBreakdown?.creditsUsedMonth || 0)}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">Credits consumed this month</div>
            </Card>
            <Card className="border border-white/80 bg-white/90 p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <ShieldCheck size={18} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Trust</span>
              </div>
              <div className="mt-4 text-2xl font-black text-slate-900">{formatPercent(overview?.usage.resolutionRate || 0)}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">Resolution rate across AI handling</div>
            </Card>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border border-white/80 bg-white/90 p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Included Tokens</div>
              <div className="mt-3 text-2xl font-black text-slate-900">{Number(addonStatus?.subscription?.includedTokensPerCycle || 0)}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">monthly allocation</div>
            </Card>
            <Card className="border border-white/80 bg-white/90 p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Remaining Tokens</div>
              <div className="mt-3 text-2xl font-black text-slate-900">{Number(addonStatus?.workspace.remainingTokens || 0)}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">live runtime available</div>
            </Card>
            <Card className="border border-white/80 bg-white/90 p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Top-up Tokens</div>
              <div className="mt-3 text-2xl font-black text-slate-900">{Number(addonStatus?.subscription?.remainingTopupTokens || 0)}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">preserved until used</div>
            </Card>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">WhatsApp Live Status</div>
              <h2 className="mt-2 text-xl font-black text-slate-900">Know exactly why live AI is replying or blocked</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                This checks workspace readiness, WhatsApp connection, active AI agents, and recent inbox blockers like human takeover or active flow sessions.
              </p>
            </div>
            <div className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] ${liveRuntime?.liveReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {liveRuntime?.liveReady ? "Live Ready" : "Action Needed"}
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <SummaryRow label="Workspace AI" value={liveRuntime?.aiEnabled ? "Enabled" : "Disabled"} />
            <SummaryRow label="WhatsApp" value={liveRuntime?.whatsappConnected ? "Connected" : "Not connected"} />
            <SummaryRow label="Active Agents" value={String(liveRuntime?.activeAgentCount || 0)} />
            <SummaryRow label="WA-capable Agents" value={String(liveRuntime?.whatsappCapableAgentCount || 0)} />
          </div>
          {liveRuntime?.activeConnection ? (
            <div className="mt-4 rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              Connected number: <span className="font-black text-slate-900">{liveRuntime.activeConnection.displayPhoneNumber || "Unknown"}</span>
              {liveRuntime.activeConnection.wabaName ? ` | WABA: ${liveRuntime.activeConnection.wabaName}` : ""}
            </div>
          ) : null}
          <div className="mt-4 space-y-3">
            {(liveRuntime?.blockers || []).length === 0 ? (
              <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-800">
                Live WhatsApp AI runtime looks eligible. If replies still do not go out, inspect the blocked conversation list below or worker logs.
              </div>
            ) : (
              (liveRuntime?.blockers || []).map((blocker: any) => (
                <div key={blocker.code} className={`rounded-[14px] border px-4 py-4 ${blocker.severity === "error" ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"}`}>
                  <div className="flex items-start gap-3">
                    {blocker.severity === "error" ? <ShieldX size={18} className="mt-0.5 text-rose-600" /> : <AlertTriangle size={18} className="mt-0.5 text-amber-600" />}
                    <div>
                      <div className="font-black text-slate-900">{blocker.title}</div>
                      <div className="mt-1 text-sm font-medium text-slate-600">{blocker.message}</div>
                      {blocker.action ? <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{blocker.action}</div> : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Attention Needed</div>
              <h2 className="mt-2 text-xl font-black text-slate-900">Recent threads that may need action</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                Compact live inbox diagnostics. Open the conversations tab when you need full control.
              </p>
            </div>
            <Button variant="outline" onClick={() => setTab("conversations")}>Open Conversations</Button>
          </div>
          <div className="mt-5 space-y-3">
            {(liveRuntime?.conversations || []).length === 0 ? (
              <EmptyState title="No recent inbox diagnostics" body="Recent WhatsApp conversations will appear here after inbound messages arrive." />
            ) : (
              (liveRuntime?.conversations || []).slice(0, 4).map((conversation: any) => (
                <div key={conversation.id} className="rounded-[14px] border border-slate-200 px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-black text-slate-900">{conversation.contactName || conversation.phone}</div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {conversation.phone} | {conversation.aiState || "No AI state"} | {conversation.aiAgentName || "No agent bound"}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-slate-400">{formatDateTime(conversation.lastMessageAt)}</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {conversation.hasHumanTakeover ? <RuntimeBadge tone="warn" label="Human takeover" /> : null}
                    {conversation.hasAssignedOwner && !conversation.hasHumanTakeover ? <RuntimeBadge tone="ok" label="CRM owner assigned" /> : null}
                    {conversation.automationPausedAt ? <RuntimeBadge tone="warn" label={`Paused: ${conversation.automationPauseReason || "automation"}`} /> : null}
                    {conversation.hasActiveFlowSession ? <RuntimeBadge tone="warn" label="Active flow session" /> : null}
                    {conversation.aiLastErrorMessage ? <RuntimeBadge tone="error" label="Last runtime error" /> : null}
                    {conversation.lastAiStatus === "failed" ? <RuntimeBadge tone="error" label="Last inbound failed" /> : null}
                    {conversation.lastAiStatus === "skipped" && conversation.lastAiReason ? <RuntimeBadge tone="warn" label={`Last skip: ${humanizeRuntimeReason(conversation.lastAiReason)}`} /> : null}
                    {!conversation.blockedReasons.length ? <RuntimeBadge tone="ok" label="No known blocker" /> : null}
                  </div>
                  {conversation.preview ? <p className="mt-3 text-sm font-medium leading-6 text-slate-500">{conversation.preview}</p> : null}
                  {conversation.aiHandoverReason ? <div className="mt-2 text-xs font-semibold text-slate-500">Handover reason: {conversation.aiHandoverReason}</div> : null}
                  {conversation.lastAiReason ? <div className="mt-2 text-xs font-semibold text-amber-700">Last AI runtime reason: {humanizeRuntimeReason(conversation.lastAiReason)}</div> : null}
                  {conversation.lastAiError ? <div className="mt-2 text-xs font-semibold text-rose-600">Last inbound error: {conversation.lastAiError}</div> : null}
                  {conversation.aiLastErrorMessage ? <div className="mt-2 text-xs font-semibold text-rose-600">Last AI error: {conversation.aiLastErrorMessage}</div> : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => { setTab("conversations"); setConversationPhone(conversation.phone); }}>
                      Open Inbox View
                    </Button>
                    {conversation.recommendedAction === "return_to_ai" ? (
                      <Button onClick={() => void handleReturnConversationToAi(conversation.phone)}>
                        <BrainCircuit size={16} />
                        Return To AI
                      </Button>
                    ) : null}
                    {conversation.recommendedAction === "release_flow_block" ? (
                      <Button onClick={() => void handleReleaseFlowBlock(conversation.phone)}>
                        <LockOpen size={16} />
                        Release Flow Block
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
        </>
      )}

      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full gap-2 rounded-[18px] border border-white/80 bg-white/88 p-2 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.4)] backdrop-blur">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`inline-flex min-w-max items-center gap-2 rounded-[14px] px-4 py-3 text-xs font-black uppercase tracking-[0.22em] transition ${
              tab === item.key
                ? "bg-[linear-gradient(135deg,_#111827,_#0f766e)] text-white shadow-[0_14px_32px_-18px_rgba(15,23,42,0.75)]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
        </div>
      </div>

      <Card className="overflow-hidden border border-white/80 bg-white/92 p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
              <SlidersHorizontal size={14} />
              Explore runtime data
            </div>
            <div className="mt-2 text-lg font-black text-slate-900">Filter AI performance like a marketplace analytics console</div>
            <p className="mt-1 text-sm font-medium text-slate-500">Slice usage, agents, and channels without leaving the workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setQuickRange("today")} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900">
              Today
            </button>
            <button type="button" onClick={() => setQuickRange("7d")} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900">
              Last 7 days
            </button>
            <button type="button" onClick={() => setQuickRange("month")} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900">
              Month to date
            </button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_0.8fr_auto]">
          <Input
            label="From"
            type="date"
            value={analyticsDateFrom}
            onChange={(event) => setAnalyticsDateFrom(event.target.value)}
            className="min-w-[170px]"
          />
          <Input
            label="To"
            type="date"
            value={analyticsDateTo}
            onChange={(event) => setAnalyticsDateTo(event.target.value)}
            className="min-w-[170px]"
          />
          <Select
            label="Agent"
            value={analyticsAgentId}
            onChange={(event) => setAnalyticsAgentId(event.target.value)}
            className="min-w-[220px]"
          >
            <option value="">All agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </Select>
          <Select
            label="Channel"
            value={analyticsChannel}
            onChange={(event) => setAnalyticsChannel(event.target.value as "all" | "test" | "whatsapp" | "api")}
            className="min-w-[170px]"
          >
            <option value="all">All channels</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="test">Test</option>
            <option value="api">API</option>
          </Select>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full border-slate-200 bg-white"
              onClick={() => {
                setAnalyticsDateFrom(toDateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
                setAnalyticsDateTo(toDateInputValue(new Date()));
                setAnalyticsAgentId("");
                setAnalyticsChannel("all");
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">Agent: {selectedAgentName}</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">Channel: {analyticsChannel === "all" ? "All" : analyticsChannel}</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            <CalendarRange size={13} />
            Range: {formatDateCompact(analyticsDateFrom)} to {formatDateCompact(analyticsDateTo)}
          </span>
        </div>
      </Card>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {tab === "overview" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Active Agents" value={String(overview?.agentCounts.active || 0)} helper={`${overview?.agentCounts.total || 0} total`} />
            <MetricCard label="Remaining Credits" value={String(addonStatus?.workspace.remainingCredits || 0)} helper={`${Number(addonStatus?.workspace.remainingTokens || 0)} tokens`} />
            <MetricCard label="Available Tokens" value={String(Number(addonStatus?.workspace.remainingTokens || 0))} helper="runtime budget" />
            <MetricCard label="Today's AI Replies" value={String(overview?.usage.todayReplies || 0)} helper={`${formatCredits(overview?.usage.todayCredits || 0)} credits today`} />
            <MetricCard label="Handovers" value={String(overview?.usage.handoverCount || 0)} helper={`${formatPercent(overview?.usage.resolutionRate || 0)} resolution`} />
            <MetricCard label="Knowledge Hit Rate" value={formatPercent(overview?.knowledge.knowledgeHitRate || 0)} helper={`${overview?.knowledge.knowledgeHitCount || 0} hits`} />
            <MetricCard label="Knowledge Sources" value={String(overview?.knowledge.totalSources || 0)} helper={`${overview?.knowledge.indexedSources || 0} indexed`} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">7 Day Usage</div>
                  <h2 className="mt-2 text-xl font-black text-slate-900">Credits and Runtime Activity</h2>
                </div>
                <Button variant="outline" onClick={() => setTab("usage")}>Open Usage</Button>
              </div>
              <MiniBarChart series={dashboard?.usageSeries || []} />
            </Card>

              <Card className="p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Analytics Snapshot</div>
                <div className="mt-3 text-2xl font-black text-slate-900">{addonStatus?.subscription?.planName || "AI Agent Add-on"}</div>
                <div className="mt-4 space-y-3">
                  <SummaryRow label="Range Credits" value={formatCredits(usageBreakdown?.creditsUsedRange || 0)} />
                  <SummaryRow label="Included Tokens" value={String(Number(addonStatus?.subscription?.includedTokensPerCycle || 0))} />
                  <SummaryRow label="Remaining Tokens" value={String(Number(addonStatus?.workspace.remainingTokens || 0))} />
                  <SummaryRow label="Top-up Tokens" value={String(Number(addonStatus?.subscription?.remainingTopupTokens || 0))} />
                  <SummaryRow label="Replies This Month" value={String(usageBreakdown?.repliesMonth || 0)} />
                  <SummaryRow label="Est. Cost" value={formatCurrency(usageBreakdown?.estimatedCost || 0, addonStatus?.wallet.currency)} />
                  <SummaryRow label="Renewal Date" value={formatDate(addonStatus?.workspace.renewalDate)} />
                  <SummaryRow label="Wallet Balance" value={formatCurrency(addonStatus?.wallet.balance || 0, addonStatus?.wallet.currency)} />
                </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => setTopupOpen(true)}>
                  <Coins size={16} />
                  Buy AI Credits
                </Button>
                <Button variant="outline" onClick={() => setTab("billing")}>Billing</Button>
              </div>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Top Agents</h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">Top performers using real runtime usage logs.</p>
                </div>
                <Button variant="outline" onClick={() => setTab("agents")}>Manage Agents</Button>
              </div>
              <div className="mt-4 space-y-3">
                {(dashboard?.topAgents || []).length === 0 ? (
                  <EmptyState title="No agents yet" body="Create your first AI agent to see performance summaries here." />
                ) : (
                  (dashboard?.topAgents || []).map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between gap-3 rounded-[10px] border border-slate-200 px-4 py-3">
                      <div>
                        <div className="font-black text-slate-900">{agent.name}</div>
                        <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          {agent.persona} • {agent.status}
                        </div>
                      </div>
                        <div className="text-right text-sm font-black text-slate-900">
                          <div>{agent.messages} msgs</div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">{agent.replies} replies • {agent.handovers} handovers</div>
                        </div>
                      </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Recent Conversations</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Latest AI conversations across live inbox and test runtime activity.</p>
                </div>
                <Button variant="outline" onClick={() => setTab("conversations")}>Open Conversations</Button>
              </div>
              <div className="mt-4 space-y-3">
                {(dashboard?.recentConversations || []).length === 0 ? (
                  <EmptyState title="No conversations yet" body="Live inbox or test-runtime conversations will appear here once an agent starts handling messages." />
                ) : (
                  (dashboard?.recentConversations || []).slice(0, 5).map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => navigate(`/app/ai-agents/${conversation.agentId}/test`)}
                      className="w-full rounded-[10px] border border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-black text-slate-900">{conversation.agentName}</div>
                          <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {conversation.contactName || conversation.contactPhone || "Sandbox"} • {conversation.channel}
                          </div>
                        </div>
                        <div className="text-xs font-bold text-slate-400">{formatDateTime(conversation.lastMessageAt)}</div>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-500">{conversation.preview || "No preview available."}</p>
                    </button>
                  ))
                )}
              </div>
            </Card>
          </section>
        </div>
      ) : null}

      {tab === "agents" ? (
        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
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

            <div className="space-y-3">
              {loading ? [1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-[10px] bg-slate-200/70" />) : null}
              {!loading && filteredAgents.length === 0 ? (
                <Card className="p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[10px] bg-brand-50 text-brand-700">
                    <BrainCircuit size={24} />
                  </div>
                  <h3 className="mt-4 font-black text-slate-900">No AI agents yet</h3>
                  <p className="mt-2 text-sm font-medium text-slate-500">Create Sales, Support, FAQ, or Booking agents.</p>
                  <Button className="mt-4" onClick={startCreate}>Create Agent</Button>
                </Card>
              ) : null}
              {!loading &&
                filteredAgents.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => startEdit(agent)}
                    className={`w-full rounded-[10px] border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      selected?.id === agent.id ? "border-brand-400 ring-4 ring-brand-50" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-slate-900">{agent.name}</div>
                        <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                          {agent.persona} • Gemini
                        </div>
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
                  </button>
                ))}
            </div>
          </section>

          <section className="space-y-5">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Agent Marketplace</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Browse existing agents first. Create or edit only when you need to change live behavior.</p>
                </div>
                <Button onClick={startCreate}><Plus size={16} />Create AI Agent</Button>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <SummaryRow label="Selected Agent" value={selected?.name || "None selected"} />
                <SummaryRow label="Default Model" value={selected?.modelName || dashboard?.settings.modelDefault || "gemini-3.5-flash"} />
                <SummaryRow label="Status" value={selected?.status || "Draft"} />
                <SummaryRow label="Channels" value={selected?.runtimeControls?.routing?.channels?.join(", ") || "whatsapp, test, api"} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {selected ? (
                  <>
                    <Button variant="outline" onClick={() => navigate(`/app/ai-agents/${selected.id}/test`)}>
                      <MessageCircle size={16} />
                      Test Agent
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/app/ai-agents/${selected.id}/knowledge`)}>
                      <BookOpen size={16} />
                      Manage Knowledge
                    </Button>
                    <Button variant="outline" onClick={() => setIsAgentModalOpen(true)}>
                      <Settings2 size={16} />
                      Edit Agent
                    </Button>
                    <Button variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => void deleteAgent(selected)} disabled={saving}>
                      <Trash2 size={16} />
                      Delete
                    </Button>
                  </>
                ) : (
                  <div className="rounded-[12px] border border-dashed border-slate-200 px-4 py-5 text-sm font-medium text-slate-500">
                    Select an agent card from the left, then edit it in a modal. The agents tab stays focused on list management by default.
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Token visibility</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <SummaryRow label="Total Included Tokens" value={String(Number(addonStatus?.subscription?.includedTokensPerCycle || 0))} />
                <SummaryRow label="Remaining Tokens" value={String(Number(addonStatus?.workspace.remainingTokens || 0))} />
                <SummaryRow label="Remaining Top-up Tokens" value={String(Number(addonStatus?.subscription?.remainingTopupTokens || 0))} />
                <SummaryRow label="Remaining Credits" value={String(Number(addonStatus?.workspace.remainingCredits || 0))} />
              </div>
            </Card>

            <Card className="p-5">
              <ReplyPolicyCard agent={selected} />
            </Card>

            <Card className="p-5">
              <ManagedFileSearchCard
                agent={selected}
                saving={saving}
                managedState={managedFileSearch}
                onToggle={(enabled) => (selected ? void toggleManagedFileSearch(selected, enabled) : undefined)}
                onManageKnowledge={() => (selected ? navigate(`/app/ai-agents/${selected.id}/knowledge`) : undefined)}
              />
            </Card>
          </section>
          <Modal open={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} title={selected ? `Edit ${selected.name}` : "Create AI Agent"} className="max-w-6xl">
            <section className="space-y-5">
              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{selected ? "Edit AI Agent" : "Create AI Agent"}</h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">Industry-style builder modal for model, routing, guardrails, tools, and knowledge behavior.</p>
                  </div>
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
                  <Input label="Runtime" value="Gemini" readOnly />
                  <Select label="Gemini model" value={String(draft.modelName || dashboard?.settings.modelDefault || "gemini-3.5-flash")} onChange={(event) => updateDraft({ modelName: event.target.value, modelProvider: "gemini" })}>
                    {modelOptions.map((model) => (
                      <option key={model.key} value={model.key}>{model.label}{model.deprecated ? " (Deprecated)" : ""}</option>
                    ))}
                  </Select>
                </div>
                <div className="mt-3">
                  <Textarea label="Description" value={String(draft.description || "")} onChange={(event) => updateDraft({ description: event.target.value })} />
                </div>
                <div className="mt-3">
                  <Textarea label="System prompt" value={String(draft.systemPrompt || "")} onChange={(event) => updateDraft({ systemPrompt: event.target.value })} />
                </div>
                <div className="mt-5">
                  <ReplyPolicyCard agent={draft} compact />
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Managed Gemini File Search</h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">Auto-sync your knowledge into Gemini retrieval so live replies use cleaner context with fewer prompt tokens.</p>
                  </div>
                  <label className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-600"
                      checked={(draft.metadata as any)?.managedFileSearch?.enabled !== false}
                      onChange={(event) =>
                        updateDraft({
                          metadata: {
                            ...(draft.metadata || {}),
                            managedFileSearch: {
                              ...((draft.metadata as any)?.managedFileSearch || {}),
                              enabled: event.target.checked,
                            },
                          },
                        })
                      }
                    />
                    Managed search on
                  </label>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <SummaryRow label="Mode" value={(draft.metadata as any)?.managedFileSearch?.enabled !== false ? "Enabled" : "Disabled"} />
                  <SummaryRow label="Sync Source" value="Gemini File Search store" />
                </div>
                {selected ? (
                  <div className="mt-4 rounded-[16px] border border-slate-200 bg-slate-50/70 p-4">
                    <ManagedFileSearchCard
                      agent={selected}
                      saving={saving}
                      compact
                      managedState={managedFileSearch}
                      onToggle={(enabled) => void toggleManagedFileSearch(selected, enabled)}
                      onManageKnowledge={() => navigate(`/app/ai-agents/${selected.id}/knowledge`)}
                    />
                  </div>
                ) : (
                  <div className="mt-4 rounded-[14px] border border-dashed border-slate-200 px-4 py-4 text-sm font-medium text-slate-500">
                    Create the agent first, then add documents in Knowledge. Sync status, store status, and last errors will appear here automatically.
                  </div>
                )}
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
                    {Boolean((draft.tools || []).find((item) => item.type === "send_buttons")?.enabled) ? (
                      <SendButtonsToolConfig
                        config={sendButtonsConfig(draft)}
                        flows={automationFlows}
                        flowsLoading={automationFlowsLoading}
                        onAdd={addSendButton}
                        onDefaultBodyChange={(defaultBody) => updateSendButtonsConfig({ defaultBody })}
                        onRemove={removeSendButton}
                        onUpdate={updateSendButton}
                      />
                    ) : null}
                  </div>
                </Card>
                <Card className="p-5">
                  <h3 className="flex items-center gap-2 text-lg font-black text-slate-900"><ShieldCheck size={18} /> Guardrails</h3>
                  <div className="mt-4 space-y-3">
                    <Input label="Max messages/session" type="number" min={1} max={500} value={Number(draft.guardrails?.maxMessagesPerSession || 50)} onChange={(event) => updateDraft({ guardrails: { ...(draft.guardrails as any), maxMessagesPerSession: Number(event.target.value) } })} />
                    <Input label="Confidence threshold" type="number" min={0.1} max={0.95} step={0.05} value={Number(draft.guardrails?.confidenceThreshold || 0.55)} onChange={(event) => updateDraft({ guardrails: { ...(draft.guardrails as any), confidenceThreshold: Number(event.target.value) } })} />
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
              <div className="grid gap-5 lg:grid-cols-2">
                <Card className="p-5">
                  <h3 className="flex items-center gap-2 text-lg font-black text-slate-900"><Clock3 size={18} /> Runtime Controls</h3>
                  <div className="mt-4 space-y-4">
                    <label className="flex items-center gap-3 rounded-[8px] border border-slate-200 p-3 text-sm font-bold text-slate-700">
                      <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={draft.runtimeControls?.businessHours?.enabled === true} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), businessHours: { ...(draft.runtimeControls as any)?.businessHours, enabled: event.target.checked } } })} />
                      Business hours routing
                    </label>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input label="Timezone" value={String(draft.runtimeControls?.businessHours?.timezone || "Asia/Calcutta")} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), businessHours: { ...(draft.runtimeControls as any)?.businessHours, timezone: event.target.value } } })} />
                      <Input label="Days" value={listToCsv(draft.runtimeControls?.businessHours?.days)} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), businessHours: { ...(draft.runtimeControls as any)?.businessHours, days: csvToList(event.target.value) } } })} placeholder="mon, tue, wed, thu, fri" />
                      <Input label="Start time" value={String(draft.runtimeControls?.businessHours?.startTime || "09:00")} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), businessHours: { ...(draft.runtimeControls as any)?.businessHours, startTime: event.target.value } } })} />
                      <Input label="End time" value={String(draft.runtimeControls?.businessHours?.endTime || "18:00")} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), businessHours: { ...(draft.runtimeControls as any)?.businessHours, endTime: event.target.value } } })} />
                      <Select label="After-hours action" value={String(draft.runtimeControls?.businessHours?.afterHoursAction || "reply_and_handover")} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), businessHours: { ...(draft.runtimeControls as any)?.businessHours, afterHoursAction: event.target.value } } })}>
                        <option value="reply_and_handover">Reply and handover</option>
                        <option value="handover_only">Handover only</option>
                        <option value="pause">Pause AI</option>
                      </Select>
                    </div>
                    <label className="flex items-center gap-3 rounded-[8px] border border-slate-200 p-3 text-sm font-bold text-slate-700">
                      <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={draft.runtimeControls?.escalationRules?.enabled === true} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), escalationRules: { ...(draft.runtimeControls as any)?.escalationRules, enabled: event.target.checked } } })} />
                      Escalation rules
                    </label>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input label="Escalation keywords" value={listToCsv(draft.runtimeControls?.escalationRules?.keywords)} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), escalationRules: { ...(draft.runtimeControls as any)?.escalationRules, keywords: csvToList(event.target.value) } } })} placeholder="refund, complaint, angry" />
                      <Input label="SLA minutes" type="number" min={1} max={1440} value={Number(draft.runtimeControls?.escalationRules?.slaMinutes || 30)} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), escalationRules: { ...(draft.runtimeControls as any)?.escalationRules, slaMinutes: Number(event.target.value) } } })} />
                      <Select label="Escalation action" value={String(draft.runtimeControls?.escalationRules?.action || "handover")} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), escalationRules: { ...(draft.runtimeControls as any)?.escalationRules, action: event.target.value } } })}>
                        <option value="handover">Handover</option>
                        <option value="pause">Pause</option>
                      </Select>
                      <label className="flex items-center gap-3 rounded-[8px] border border-slate-200 p-3 text-sm font-bold text-slate-700">
                        <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={draft.runtimeControls?.conversationSla?.enabled === true} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), conversationSla: { ...(draft.runtimeControls as any)?.conversationSla, enabled: event.target.checked } } })} />
                        Conversation SLA enabled
                      </label>
                      <Input label="First response SLA" type="number" min={1} max={1440} value={Number(draft.runtimeControls?.conversationSla?.firstResponseMinutes || 15)} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), conversationSla: { ...(draft.runtimeControls as any)?.conversationSla, firstResponseMinutes: Number(event.target.value) } } })} />
                    </div>
                  </div>
                </Card>
                <Card className="p-5">
                  <h3 className="flex items-center gap-2 text-lg font-black text-slate-900"><Bot size={18} /> Routing, Fallbacks & Audit</h3>
                  <div className="mt-4 space-y-3">
                    <Input label="Routing keywords" value={listToCsv(draft.runtimeControls?.routing?.keywords)} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), routing: { ...(draft.runtimeControls as any)?.routing, keywords: csvToList(event.target.value) } } })} placeholder="sales, order, booking, support" />
                    <Input label="Routing priority" type="number" min={0} max={1000} value={Number(draft.runtimeControls?.routing?.priority || 100)} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), routing: { ...(draft.runtimeControls as any)?.routing, priority: Number(event.target.value) } } })} />
                    <Input label="Routing channels" value={listToCsv(draft.runtimeControls?.routing?.channels as string[])} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), routing: { ...(draft.runtimeControls as any)?.routing, channels: csvToList(event.target.value) } } })} placeholder="whatsapp, test, api" />
                    <Textarea label="After-hours fallback" value={String(draft.runtimeControls?.fallbackTemplates?.afterHours || "")} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), fallbackTemplates: { ...(draft.runtimeControls as any)?.fallbackTemplates, afterHours: event.target.value } } })} />
                    <Textarea label="Escalation fallback" value={String(draft.runtimeControls?.fallbackTemplates?.escalation || "")} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), fallbackTemplates: { ...(draft.runtimeControls as any)?.fallbackTemplates, escalation: event.target.value } } })} />
                    <Textarea label="No-answer fallback" value={String(draft.runtimeControls?.fallbackTemplates?.noAnswer || "")} onChange={(event) => updateDraft({ runtimeControls: { ...(draft.runtimeControls as any), fallbackTemplates: { ...(draft.runtimeControls as any)?.fallbackTemplates, noAnswer: event.target.value } } })} />
                  </div>
                  {selected ? (
                    <div className="mt-5 rounded-[10px] border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Version History</div>
                      <div className="mt-2 text-sm font-black text-slate-900">Current version: {selected.version || 1}</div>
                      <div className="mt-3 space-y-2">
                        {(selected.versionHistory || []).length === 0 ? (
                          <div className="text-xs font-semibold text-slate-500">No previous versions saved yet.</div>
                        ) : (
                          (selected.versionHistory || []).slice().reverse().slice(0, 5).map((entry, index) => (
                            <div key={entry._id || `${entry.version}-${index}`} className="rounded-[8px] border border-slate-200 bg-white px-3 py-2">
                              <div className="text-sm font-black text-slate-900">v{entry.version}</div>
                              <div className="mt-1 text-xs font-semibold text-slate-500">{entry.reason || "agent_updated"} • {formatDateTime(entry.changedAt || null)}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}
                </Card>
              </div>
              <div className="sticky bottom-4 flex justify-end gap-2 rounded-[10px] border border-slate-200 bg-white/90 p-3 shadow-xl backdrop-blur">
                <Button variant="outline" onClick={() => setIsAgentModalOpen(false)}>Cancel</Button>
                <Button onClick={() => void saveAgent()} disabled={saving}>
                  <CheckCircle2 size={17} />
                  {saving ? "Saving..." : selected ? "Save Agent" : "Create Agent"}
                </Button>
              </div>
            </section>
          </Modal>
        </div>
      ) : null}

      {tab === "conversations" ? (
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Conversation Control Guide</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  `Human active` means a person has taken over, so use `Return To AI`. `Paused` plus `flow_handover` usually means a flow session is blocking AI, so use `Release Flow Block`.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
                Clear unblock actions
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SummaryRow label="Human Active" value="Return To AI" />
              <SummaryRow label="Flow Block" value="Release Flow Block" />
              <SummaryRow label="No Active Agent" value="Activate agent" />
              <SummaryRow label="No WhatsApp Routing" value="Add whatsapp channel" />
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">AI Conversations</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Reuse the live Inbox workspace with AI-only filters, thread history, handover actions, confidence, and runtime context.</p>
              </div>
              <Button variant="outline" onClick={() => void loadShell()}>
                <RefreshCw size={16} />
                Refresh
              </Button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Select
                label="Agent"
                value={conversationAgentId}
                onChange={(event) => {
                  setConversationAgentId(event.target.value);
                  setConversationPhone("");
                }}
              >
                <option value="">All AI agents</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </Select>
              <Select
                label="AI State"
                value={conversationAiState}
                onChange={(event) => {
                  setConversationAiState(event.target.value);
                  setConversationPhone("");
                }}
              >
                <option value="">All states</option>
                <option value="AI_ACTIVE">AI active</option>
                <option value="HANDOVER_PENDING">Handover pending</option>
                <option value="HUMAN_ACTIVE">Human active</option>
                <option value="PAUSED">Paused</option>
                <option value="CLOSED">Closed</option>
              </Select>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setConversationAgentId("");
                    setConversationAiState("");
                    setConversationPhone("");
                  }}
                >
                  Reset Inbox Filters
                </Button>
              </div>
            </div>
          </Card>
          <Card className="overflow-hidden p-0">
            <div className="h-[78vh] min-h-[720px]">
              <ConversationWorkspace
                controlledPhone={conversationPhone}
                embedded
                listParams={{
                  aiOnly: true,
                  agentId: conversationAgentId || undefined,
                  aiState: conversationAiState ? [conversationAiState] : undefined,
                }}
                onClearSelection={() => setConversationPhone("")}
                onSelectPhone={setConversationPhone}
                routeBase="/app/ai-agents"
                searchPlaceholder="Search AI conversations..."
              />
            {false && ((dashboard?.recentConversations || []).length === 0 ? (
              <EmptyState title="No conversations found" body="Run a test chat from any agent to populate this feed." />
            ) : (
              (dashboard?.recentConversations || []).map((conversation) => (
                <div key={conversation.id} className="rounded-[10px] border border-slate-200 px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-black text-slate-900">{conversation.agentName}</div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {conversation.contactName || conversation.contactPhone || "Sandbox"} • {conversation.channel} • {conversation.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-semibold text-slate-400">{formatDateTime(conversation.lastMessageAt)}</div>
                      {conversation.channel === "whatsapp" && conversation.contactPhone ? (
                        <Button variant="outline" onClick={() => navigate(`/app/conversations?phone=${encodeURIComponent(conversation.contactPhone)}`)}>
                          Open Inbox
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={() => navigate(`/app/ai-agents/${conversation.agentId}/test`)}>
                          Open Test
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-500">{conversation.preview || "No preview available."}</p>
                </div>
              ))
            ))}
          </div>
        </Card>
        </div>
      ) : null}

      {tab === "usage" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Credits Today" value={formatCredits(usageBreakdown?.creditsUsedToday || 0)} helper={`${usageBreakdown?.repliesToday || 0} replies`} />
            <MetricCard label="Credits This Month" value={formatCredits(usageBreakdown?.creditsUsedMonth || 0)} helper="monthly burn" />
            <MetricCard label="Total Replies" value={String(usageBreakdown?.repliesCount || 0)} helper={`${usageBreakdown?.totalRequests || 0} requests`} />
            <MetricCard label="Handovers" value={String(usageBreakdown?.handoverCount || 0)} helper={`${dashboard?.overview.conversationCounts.handover || 0} convo handovers`} />
            <MetricCard label="Resolution Rate" value={formatPercent(usageBreakdown?.resolutionRate || 0)} helper={`${formatPercent(usageBreakdown?.successRate || 0)} success`} />
            <MetricCard label="Knowledge Hit Rate" value={formatPercent(usageBreakdown?.knowledgeHitRate || 0)} helper={`${formatCurrency(usageBreakdown?.estimatedCost || 0, addonStatus?.wallet.currency)} est. cost`} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">7 Day Usage Trend</div>
                  <h2 className="mt-2 text-xl font-black text-slate-900">Credits, replies, and handovers</h2>
                </div>
              </div>
              <MiniBarChart series={dashboard?.usageSeries || []} />
            </Card>
            <Card className="p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Performance Summary</div>
              <div className="mt-4 space-y-3">
                <SummaryRow label="Range Requests" value={String(usageBreakdown?.totalRequests || 0)} />
                <SummaryRow label="Blocked Rate" value={formatPercent(usageBreakdown?.blockedRate || 0)} />
                <SummaryRow label="Avg Latency" value={`${usageBreakdown?.avgLatencyMs || 0}ms`} />
                <SummaryRow label="WhatsApp Replies" value={String(usageBreakdown?.replyChannels?.whatsapp || 0)} />
                <SummaryRow label="Test Replies" value={String(usageBreakdown?.replyChannels?.test || 0)} />
                <SummaryRow label="API Replies" value={String(usageBreakdown?.replyChannels?.api || 0)} />
              </div>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Channel Breakdown</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Compare request volume, credits, and handovers by channel.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {(dashboard?.channelBreakdown || []).length === 0 ? (
                  <EmptyState title="No channel activity" body="Runtime usage will appear here once AI starts handling messages." />
                ) : (
                  (dashboard?.channelBreakdown || []).map((item) => (
                    <div key={item.channel} className="rounded-[10px] border border-slate-200 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-black uppercase tracking-wider text-slate-900">{item.channel}</div>
                        <div className="text-xs font-semibold text-slate-400">{item.requests} requests</div>
                      </div>
                      <div className="mt-2 grid gap-2 md:grid-cols-3">
                        <SummaryRow label="Credits" value={formatCredits(item.creditsUsed)} />
                        <SummaryRow label="Replies" value={String(item.replies)} />
                        <SummaryRow label="Handovers" value={String(item.handovers)} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Recent Usage Entries</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Latest debit entries from the AI credit ledger.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {usageTransactions.length === 0 ? (
                  <EmptyState title="No usage yet" body="Usage entries will appear once AI starts handling test or live messages." />
                ) : (
                  usageTransactions.slice(0, 6).map((item) => (
                    <div key={item.id} className="rounded-[10px] border border-slate-200 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-black text-slate-900">{formatCredits(item.credits)} credits</div>
                        <div className="text-xs font-semibold text-slate-400">{formatDateTime(item.createdAt)}</div>
                      </div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{formatTransactionType(item.type)}</div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>
        </div>
      ) : null}

      {tab === "billing" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Plan" value={billingSummary?.currentPlan.planName || addonStatus?.subscription?.planName || "AI Add-on"} helper={formatDate(addonStatus?.workspace.renewalDate)} />
            <MetricCard label="Included Remaining" value={String(billingSummary?.balanceBreakdown.includedRemainingCredits ?? addonStatus?.workspace.remainingIncludedCredits ?? 0)} helper="monthly allocation" />
            <MetricCard label="Top-up Remaining" value={String(billingSummary?.balanceBreakdown.topupRemainingCredits ?? addonStatus?.workspace.remainingTopupCredits ?? 0)} helper="preserved until used" />
            <MetricCard label="Total Remaining" value={String(billingSummary?.balanceBreakdown.totalRemainingCredits ?? addonStatus?.workspace.remainingCredits ?? 0)} helper="available now" />
            <MetricCard label="Used This Month" value={formatCredits(billingSummary?.balanceBreakdown.creditsUsedThisMonth || 0)} helper={`${billingSummary?.usage.totalRequests || 0} requests`} />
            <MetricCard label="Wallet Balance" value={formatCurrency(addonStatus?.wallet.balance || 0, addonStatus?.wallet.currency)} helper="INR recharge source" />
          </section>

          {billingAlerts.length ? (
            <Alert tone={billingAlerts.some((item) => item.severity === "high") ? "warn" : "info"}>
              {billingAlerts.map((item) => item.message).join(" ")}
            </Alert>
          ) : null}

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Spending Breakdown</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Separate included credits, top-ups, usage, refunds, adjustments, and expiry.</p>
                </div>
                <Button onClick={() => setTopupOpen(true)}>
                  <Coins size={16} />
                  Buy AI Credits
                </Button>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                <SummaryRow label="Credits Purchased" value={formatCredits(billingSummary?.balanceBreakdown.creditsPurchasedThisMonth || 0)} />
                <SummaryRow label="Credits Refunded" value={formatCredits(billingSummary?.balanceBreakdown.creditsRefundedThisMonth || 0)} />
                <SummaryRow label="Credits Adjusted" value={formatCredits(billingSummary?.balanceBreakdown.creditsAdjustedThisMonth || 0)} />
                <SummaryRow label="Included Expired" value={formatCredits(billingSummary?.balanceBreakdown.creditsExpiredThisMonth || 0)} />
                <SummaryRow label="Avg / Request" value={formatCredits(billingSummary?.usage.avgCreditsPerRequest || 0)} />
                <SummaryRow label="Est. Remaining Runtime" value={billingSummary?.usage.estimatedRemainingRuntime !== null && billingSummary?.usage.estimatedRemainingRuntime !== undefined ? `${billingSummary.usage.estimatedRemainingRuntime} requests` : "-"} />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Budget Monitoring</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Warnings only. Runtime is not blocked in this phase.</p>
                </div>
                <Button variant="outline" onClick={() => void loadShell()}>
                  <RefreshCw size={16} />
                  Refresh
                </Button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Input label="Monthly Budget" type="number" value={budgetDraft.monthlyCreditBudget} onChange={(event) => setBudgetDraft((current) => ({ ...current, monthlyCreditBudget: event.target.value }))} />
                <Input label="Budget Warning" type="number" value={budgetDraft.monthlyCreditWarning} onChange={(event) => setBudgetDraft((current) => ({ ...current, monthlyCreditWarning: event.target.value }))} />
                <Input label="Low Credit Warning" type="number" value={budgetDraft.lowCreditWarning} onChange={(event) => setBudgetDraft((current) => ({ ...current, lowCreditWarning: event.target.value }))} />
                <Input label="Near Exhaustion Warning" type="number" value={budgetDraft.nearExhaustionWarning} onChange={(event) => setBudgetDraft((current) => ({ ...current, nearExhaustionWarning: event.target.value }))} />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-[10px] bg-slate-50 px-4 py-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Notifications</div>
                  <div className="mt-1 text-sm font-semibold text-slate-600">Budget alerts notify only and never stop runtime automatically.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setBudgetDraft((current) => ({ ...current, notificationsEnabled: !current.notificationsEnabled }))}
                  className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.2em] ${budgetDraft.notificationsEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
                >
                  {budgetDraft.notificationsEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => void saveBudgetSettings()} disabled={saving}>
                  {saving ? "Saving..." : "Save Budget Controls"}
                </Button>
              </div>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Monthly Statements</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Download reconciled monthly AI billing statements.</p>
                </div>
                <Button variant="outline" onClick={() => void downloadBillingReport("daily_ai_usage")}>Download Usage CSV</Button>
              </div>
              <div className="mt-4 space-y-3">
                {billingStatements.length === 0 ? (
                  <EmptyState title="No statements yet" body="Statements will appear here as billing history grows." />
                ) : (
                  billingStatements.map((statement) => (
                    <div key={statement.id} className="rounded-[10px] border border-slate-200 px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-black text-slate-900">{statement.periodKey}</div>
                          <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Opening {formatCredits(statement.balances.openingCredits)} | Closing {formatCredits(statement.balances.closingCredits)}
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => void downloadStatement(statement.periodKey)}>Download CSV</Button>
                      </div>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <SummaryRow label="Included Added" value={formatCredits(statement.balances.includedCreditsAdded)} />
                        <SummaryRow label="Top-up Purchased" value={formatCredits(statement.balances.topupCreditsPurchased)} />
                        <SummaryRow label="Consumed" value={formatCredits(statement.balances.creditsConsumed)} />
                        <SummaryRow label="Refunded" value={formatCredits(statement.balances.creditsRefunded)} />
                        <SummaryRow label="Adjusted" value={formatCredits(statement.balances.creditsAdjusted)} />
                        <SummaryRow label="Expired" value={formatCredits(statement.balances.includedCreditsExpired)} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Billing Timeline</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Chronological AI financial events linked to ledger transactions.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {billingTimeline.length === 0 ? (
                  <EmptyState title="No timeline events" body="Subscription, top-up, usage, refund, and expiry events will appear here." />
                ) : (
                  billingTimeline.slice(0, 8).map((item) => (
                    <div key={item.id} className="rounded-[10px] border border-slate-200 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-black text-slate-900">{item.eventLabel}</div>
                          <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{item.source || item.eventType}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-black ${item.direction === "debit" ? "text-rose-600" : "text-emerald-600"}`}>
                            {item.direction === "debit" ? "-" : "+"}{formatCredits(item.credits)} credits
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">{formatDateTime(item.createdAt)}</div>
                        </div>
                      </div>
                      {item.description ? <div className="mt-2 text-sm font-medium text-slate-500">{item.description}</div> : null}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Usage Analytics</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Workspace, agent, and model consumption based on usage logs.</p>
                </div>
                <Button variant="outline" onClick={() => void downloadBillingReport("top_consuming_agents")}>Download Agent Report</Button>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                <SummaryRow label="Workspace Credits" value={formatCredits(usageAnalytics?.workspace.creditsConsumed || 0)} />
                <SummaryRow label="Workspace Requests" value={String(usageAnalytics?.workspace.requests || 0)} />
                <SummaryRow label="Conversations" value={String(usageAnalytics?.workspace.conversations || 0)} />
                <SummaryRow label="Avg / Conversation" value={formatCredits(usageAnalytics?.workspace.avgCreditsPerConversation || 0)} />
              </div>
              <div className="mt-4 space-y-3">
                {(usageAnalytics?.agents || []).slice(0, 5).map((item) => (
                  <div key={item.agentId} className="rounded-[10px] border border-slate-200 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="font-black text-slate-900">{item.agentName}</div>
                      <div className="text-xs font-semibold text-slate-500">{formatCredits(item.creditsConsumed)} credits</div>
                    </div>
                    <div className="mt-2 grid gap-2 md:grid-cols-3">
                      <SummaryRow label="Requests" value={String(item.requests)} />
                      <SummaryRow label="Confidence" value={item.avgConfidence ? item.avgConfidence.toFixed(2) : "0.00"} />
                      <SummaryRow label="Avg Cost" value={item.avgRuntimeCost.toFixed(3)} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-3">
                {(usageAnalytics?.models || []).slice(0, 4).map((item) => (
                  <div key={item.model} className="flex items-center justify-between gap-3 rounded-[10px] bg-slate-50 px-4 py-3">
                    <div>
                      <div className="font-black text-slate-900">{item.model}</div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{item.requests} requests</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">{formatCredits(item.creditsConsumed)} credits</div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">{item.tokenConsumption} tokens</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Usage Explorer</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Searchable execution history with runtime status and credit usage.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {(usageExplorer?.items || []).length === 0 ? (
                  <EmptyState title="No usage explorer rows" body="AI executions will appear here after test or live runtime." />
                ) : (
                  (usageExplorer?.items || []).map((item) => (
                    <div key={item.id} className="rounded-[10px] border border-slate-200 px-4 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-black text-slate-900">{item.agentName}</div>
                          <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {item.model} | {item.runtimeStatus} | {item.contactName || item.contactPhone || "No contact"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-900">{formatCredits(item.creditsUsed)} credits</div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">{formatDateTime(item.createdAt)}</div>
                        </div>
                      </div>
                      <div className="mt-2 grid gap-2 md:grid-cols-3">
                        <SummaryRow label="Execution" value={item.executionId || "-"} />
                        <SummaryRow label="Confidence" value={item.confidence ? item.confidence.toFixed(2) : "0.00"} />
                        <SummaryRow label="Latency" value={`${item.latencyMs}ms`} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Ledger History</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Immutable ledger entries with entry type, source, and balance-after snapshots.</p>
              </div>
              <Button variant="outline" onClick={() => void loadShell()}>
                <RefreshCw size={16} />
                Refresh Ledger
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {transactions.length === 0 ? (
                <EmptyState title="No billing entries" body="Credit events will appear here after purchase or usage." />
              ) : (
                transactions.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-slate-200 px-4 py-3">
                    <div className="min-w-0">
                      <div className="font-black text-slate-900">{item.description || formatTransactionType(item.type)}</div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {formatTransactionType(item.type)} • {formatDateTime(item.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-black ${item.direction === "credit" ? "text-emerald-600" : "text-rose-600"}`}>
                        {item.direction === "credit" ? "+" : "-"}{formatCredits(item.credits)} credits
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">
                        {item.amount > 0 ? formatCurrency(item.amount, item.currency) : "No direct charge"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "settings" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Provider" value={dashboard?.settings.provider || "gemini"} helper="Gemini only runtime" />
            <MetricCard label="Default Model" value={dashboard?.settings.modelDefault || "gemini-3.5-flash"} helper="workspace default" />
            <MetricCard label="Billing Mode" value="Credits" helper="usage-based accounting" />
            <MetricCard label="Renewal Date" value={formatDate(dashboard?.settings.renewalDate)} helper="monthly credit reset" />
          </section>

          <Card className="p-5">
            <h2 className="text-lg font-black text-slate-900">Module Settings</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <SummaryRow label="Runtime Provider" value="Gemini" />
              <SummaryRow label="Model Selector" value="Locked to Gemini" />
              <SummaryRow label="Credit System" value="Credits-based" />
              <SummaryRow label="Reset Policy" value="Monthly included credit reset" />
              <SummaryRow label="Top-up Policy" value="Wallet based purchase, preserved until used" />
              <SummaryRow label="Sandbox Mode" value="Test chat available now" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void loadShell()}>
                <RefreshCw size={16} />
                Refresh Module
              </Button>
              <Button variant="outline" onClick={() => setTopupOpen(true)}>
                <CreditCard size={16} />
                Open Top-up
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      <TopupModal
        open={topupOpen}
        onClose={() => setTopupOpen(false)}
        packs={addonStatus?.catalog.topupPacks || []}
        currency={addonStatus?.wallet.currency || "INR"}
        purchasingPackId={purchasingPackId}
        onPurchase={purchaseTopup}
      />
    </div>
  );
}

function SendButtonsToolConfig({
  config,
  flows,
  flowsLoading,
  onAdd,
  onDefaultBodyChange,
  onRemove,
  onUpdate,
}: {
  config: { defaultBody: string; buttons: AiAgentSendButtonConfig[] };
  flows: AutomationFlowOption[];
  flowsLoading: boolean;
  onAdd: () => void;
  onDefaultBodyChange: (value: string) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, patch: Partial<AiAgentSendButtonConfig>) => void;
}) {
  return (
    <div className="rounded-[8px] border border-emerald-100 bg-emerald-50/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-black text-slate-900">Approved WhatsApp buttons</div>
          <div className="mt-1 text-xs font-medium text-slate-500">The AI can select these button IDs; flows stay server-configured.</div>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onAdd}>
          <Plus size={14} />
          Add
        </Button>
      </div>
      <div className="mt-3">
        <Textarea
          label="Default body"
          value={config.defaultBody}
          onChange={(event) => onDefaultBodyChange(event.target.value)}
          placeholder="Please choose an option."
        />
      </div>
      <div className="mt-3 space-y-3">
        {config.buttons.map((button, index) => (
          <div key={`${button.id}-${index}`} className="rounded-[8px] border border-slate-200 bg-white p-3">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.4fr_auto]">
              <Input
                label="Button ID"
                value={button.id}
                onChange={(event) => onUpdate(index, { id: event.target.value })}
                placeholder="book_demo"
              />
              <Input
                label="Title"
                maxLength={20}
                value={button.title}
                onChange={(event) => onUpdate(index, { title: event.target.value })}
                placeholder="Book Demo"
              />
              <Select
                label={flowsLoading ? "Flow (loading)" : "Target flow"}
                value={button.flowId}
                onChange={(event) => onUpdate(index, { flowId: event.target.value })}
              >
                <option value="">Select active flow</option>
                {flows.map((flow) => {
                  const id = flowOptionId(flow);
                  return id ? <option key={id} value={id}>{flow.name || id}</option> : null;
                })}
              </Select>
              <Button type="button" variant="ghost" className="mt-6 text-rose-600 hover:bg-rose-50" onClick={() => onRemove(index)}>
                <Trash2 size={14} />
              </Button>
            </div>
            <div className="mt-3">
              <Input
                label="Description"
                value={button.description || ""}
                onChange={(event) => onUpdate(index, { description: event.target.value })}
                placeholder="Optional internal note"
              />
            </div>
          </div>
        ))}
        {!config.buttons.length ? (
          <div className="rounded-[8px] border border-dashed border-slate-200 bg-white px-3 py-4 text-sm font-medium text-slate-500">
            No approved buttons configured.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TopupModal({
  open,
  onClose,
  packs,
  currency,
  purchasingPackId,
  onPurchase,
}: {
  open: boolean;
  onClose: () => void;
  packs: Array<{ packId: string; label: string; credits: number; price: number }>;
  currency: string;
  purchasingPackId: string;
  onPurchase: (packId: string) => Promise<void>;
}) {
  return (
    <Modal open={open} onClose={purchasingPackId ? () => undefined : onClose} title="Buy AI Credits" className="max-w-4xl">
      <div className="space-y-5">
        <div>
          <div className="text-sm font-semibold text-slate-500">Choose a top-up pack and refill your AI balance instantly.</div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {packs.map((pack) => (
            <div key={pack.packId} className="rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,0.96))] p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{pack.label}</div>
                <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Instant</div>
              </div>
              <div className="mt-4 text-3xl font-black text-slate-900">{pack.credits}</div>
              <div className="mt-1 text-sm font-semibold text-slate-500">Credits ready for live AI usage</div>
              <div className="mt-5 flex items-end justify-between gap-3">
                <div className="text-lg font-black text-brand-700">{formatCurrency(pack.price, currency)}</div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Marketplace pack</div>
              </div>
              <Button className="mt-4 w-full" onClick={() => void onPurchase(pack.packId)} disabled={purchasingPackId === pack.packId}>
                {purchasingPackId === pack.packId ? "Processing..." : "Buy AI Credits"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function HeroStatCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/10 p-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-white/60">{label}</div>
        <ArrowUpRight size={16} className="text-white/45" />
      </div>
      <div className="mt-3 text-2xl font-black text-white">{value}</div>
      {helper ? <div className="mt-2 text-xs font-semibold leading-5 text-slate-200/75">{helper}</div> : null}
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  const tone =
    label.toLowerCase().includes("credit")
      ? "from-emerald-50 via-white to-teal-50 border-emerald-100"
      : label.toLowerCase().includes("knowledge")
        ? "from-sky-50 via-white to-cyan-50 border-sky-100"
        : label.toLowerCase().includes("handover")
          ? "from-amber-50 via-white to-orange-50 border-amber-100"
          : "from-slate-50 via-white to-white border-slate-200";
  return (
    <Card className={cn("overflow-hidden border bg-gradient-to-br p-5 shadow-[0_22px_50px_-36px_rgba(15,23,42,0.45)]", tone)}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{label}</div>
        <div className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Live</div>
      </div>
      <div className="mt-4 text-3xl font-black tracking-tight text-slate-900">{value}</div>
      {helper ? <div className="mt-2 text-xs font-semibold leading-5 text-slate-500">{helper}</div> : null}
    </Card>
  );
}

function ManagedFileSearchCard({
  agent,
  saving,
  managedState,
  onToggle,
  onManageKnowledge,
  compact = false,
}: {
  agent?: AiAgent | null;
  saving: boolean;
  managedState: ReturnType<typeof getManagedFileSearchState>;
  onToggle: (enabled: boolean) => void;
  onManageKnowledge: () => void;
  compact?: boolean;
}) {
  if (!agent) {
    return (
      <div className="space-y-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Managed Gemini File Search</div>
          <h3 className="mt-2 text-lg font-black text-slate-900">Select an agent to inspect retrieval sync</h3>
        </div>
        <div className="rounded-[14px] border border-dashed border-slate-200 px-4 py-5 text-sm font-medium text-slate-500">
          Store status, sync state, document count, and last sync errors will appear here for the selected agent.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Managed Gemini File Search</div>
          <h3 className="mt-2 text-lg font-black text-slate-900">{compact ? "Runtime sync status" : "Knowledge retrieval control"}</h3>
          {!compact ? (
            <p className="mt-1 text-sm font-medium text-slate-500">Keep relevant chunks inside Gemini File Search instead of pushing the full knowledge base into every prompt.</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RuntimeBadge tone={managedState.tone} label={managedState.syncLabel} />
          {!compact ? (
            <Button variant={managedState.enabled ? "outline" : "primary"} onClick={() => onToggle(!managedState.enabled)} disabled={saving}>
              {managedState.enabled ? "Turn Off" : "Turn On"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryRow label="Mode" value={managedState.enabled ? "Enabled" : "Disabled"} />
        <SummaryRow label="Store" value={managedState.storeStatus} />
        <SummaryRow label="Sync" value={managedState.syncLabel} />
        <SummaryRow label="Documents" value={String(managedState.documentCount)} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SummaryRow label="Last Sync" value={managedState.syncedAt ? formatDateTime(managedState.syncedAt) : "Not yet"} />
        <SummaryRow label="Embedding" value={managedState.embeddingModel || "Gemini default"} />
      </div>

      {managedState.lastError ? (
        <div className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700">
          Last sync error: {managedState.lastError}
        </div>
      ) : null}

      {!compact ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onManageKnowledge}>
            <BookOpen size={16} />
            Open Knowledge
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ReplyPolicyCard({
  agent,
  compact = false,
}: {
  agent?: AiAgentPayload | AiAgent | null;
  compact?: boolean;
}) {
  if (!agent || !String(agent.name || "").trim()) {
    return (
      <div className="space-y-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Reply Policy</div>
          <h3 className="mt-2 text-lg font-black text-slate-900">Select or create an agent to preview response behavior</h3>
        </div>
        <div className="rounded-[14px] border border-dashed border-slate-200 px-4 py-5 text-sm font-medium text-slate-500">
          Language mirroring, short-reply policy, disclosure rules, and escalation behavior will appear here.
        </div>
      </div>
    );
  }

  const preview = getReplyPolicyPreview(agent);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Reply Policy</div>
          <h3 className="mt-2 text-lg font-black text-slate-900">{compact ? "Live response behavior preview" : "Customer-visible response behavior"}</h3>
          {!compact ? (
            <p className="mt-1 text-sm font-medium text-slate-500">
              This policy is enforced in runtime, so customers can understand exactly how this agent will talk before going live.
            </p>
          ) : null}
        </div>
        <div className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-brand-700">
          Runtime enforced
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SummaryRow label="Language" value={preview.language} />
        <SummaryRow label="Short Reply" value={preview.shortReply} />
        <SummaryRow label="Detailed Query" value={preview.detailedReply} />
        <SummaryRow label="Disclosure" value={preview.disclosure} />
        <SummaryRow label="Follow-up" value={preview.followUp} />
        <SummaryRow label="Escalation" value={preview.escalation} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SummaryRow label="After Hours" value={preview.afterHours} />
        <SummaryRow label="Channels" value={preview.channels} />
      </div>

      <div className="rounded-[14px] border border-slate-200 bg-slate-50/80 p-4">
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Fallback Message</div>
        <div className="mt-2 text-sm font-semibold leading-6 text-slate-700">{preview.fallbackMessage}</div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <PreviewBubble label="Hinglish sample" text="Haan, hum website development aur ads support karte hain. Aap kis business ke liye pooch rahe hain?" />
        <PreviewBubble label="हिंदी sample" text="हम वेबसाइट डेवलपमेंट और मार्केटिंग सपोर्ट देते हैं। आप किस business के लिए पूछ रहे हैं?" />
        <PreviewBubble label="English sample" text="Yes, we help with website development and marketing. What kind of business do you run?" />
      </div>
    </div>
  );
}

function PreviewBubble({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.45)]">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-3 rounded-[12px] bg-emerald-50 px-3 py-3 text-sm font-semibold leading-6 text-slate-800">
        {text}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(248,250,252,0.88),_rgba(255,255,255,1))] px-3 py-3">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <span className="text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}

function RuntimeBadge({ tone, label }: { tone: "ok" | "warn" | "error"; label: string }) {
  const className =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-amber-200 bg-amber-50 text-amber-700";
  return (
    <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]", className)}>
      {label}
    </span>
  );
}

function MiniBarChart({
  series,
}: {
  series: Array<{ date: string; creditsUsed: number; totalTokens: number; requests: number; failures: number }>;
}) {
  const max = Math.max(1, ...series.map((item) => Number(item.creditsUsed || 0)));
  return (
    <div className="mt-5">
      <div className="grid h-[190px] grid-cols-7 items-end gap-3">
        {series.map((item) => {
          const height = Math.max(6, Math.round((Number(item.creditsUsed || 0) / max) * 140));
          return (
            <div key={item.date} className="flex flex-col items-center gap-2">
              <div className="text-[10px] font-black text-slate-400">{formatCredits(item.creditsUsed)}</div>
              <div className="flex w-full items-end justify-center rounded-[16px] border border-slate-100 bg-[linear-gradient(180deg,_rgba(248,250,252,1),_rgba(241,245,249,0.82))] px-2 py-2" style={{ height: "156px" }}>
                <div className="w-full rounded-[10px] bg-[linear-gradient(180deg,_#0f766e,_#0f172a)] shadow-[0_16px_30px_-18px_rgba(15,23,42,0.8)]" style={{ height: `${height}px` }} title={`${item.date}: ${item.creditsUsed} credits`} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{formatShortDay(item.date)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,0.86))] px-4 py-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Sparkles size={18} />
      </div>
      <div className="mt-4 font-black text-slate-900">{title}</div>
      <div className="mt-2 text-sm font-medium leading-6 text-slate-500">{body}</div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatDateCompact(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(parsed);
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatCurrency(amount: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `${currency} ${amount || 0}`;
  }
}

function formatCredits(value: number) {
  const numeric = Number(value || 0);
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(3);
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatTransactionType(type: string) {
  return String(type || "").replace(/_/g, " ");
}

function formatShortDay(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(-2);
  return new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(parsed);
}

function toDateInputValue(value: Date) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
