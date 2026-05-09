import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCheck,
  CheckCircle2,
  Download,
  Eye,
  MessageCircle,
  RefreshCcw,
  Send,
  Pause,
  Play,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { API } from "../api/api";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { CampaignDetailSkeleton } from "../components/ui/Skeletons";
import { TemplatePreview } from "./templates/TemplatePreview";
import { parseComponentsForPreview } from "./templates/helpers";
import { useToast } from "../context/ToastContext";
import { motion } from "framer-motion";
import { cn } from "../utils/cn";
import React from "react";
import CampaignCreateModal from "../components/campaigns/CampaignCreateModal";
import type { TemplateRecord } from "../utils/templateRuntime";

type Campaign = {
  _id: string;
  name: string;
  status: string;
  templateId: string;
  templateName?: string;
  type?: string;
  totals?: { total?: number; queued?: number; sent?: number; failed?: number };
  createdAt?: string;
  updatedAt?: string;
  lastError?: { message?: any };
};

type Metrics = {
  audienceTotal: number;
  counts: {
    queued: number;
    accepted: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    replied: number;
  };
  updatedAt?: string;
};

type CampaignMessageItem = {
  id: string;
  phone: string;
  name: string;
  status: string;
  createdAt: string;
  whatsappMessageId?: string | null;
  error?: any;
};

type ReplyItem = { phone: string; name: string; text: string; createdAt: string };

type TabId = "overview" | "sent" | "delivered" | "read" | "replied" | "failed";

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

// Removed unused clamp01

function AreaChart({
  points,
  stroke = "#22c55e",
  fill = "rgba(34,197,94,0.08)",
  height = 240,
  datasets,
  showLegend = true,
}: any) {
  const allDatasets = datasets || [{ points, stroke, fill }];
  const width = 640;
  const padding = 32;

  // Calculate global maxY across all datasets
  const allYValues = allDatasets.flatMap((d: any) => d.points.map((p: any) => p.y));
  const maxY = Math.max(...allYValues, 1);


  return (
    <div className="w-full overflow-hidden rounded-[5px] border border-ink-900/10 bg-white shadow-sm">
      <div className="px-4 md:px-5 py-3 md:py-4">
        <div className="text-xs md:text-sm font-black text-ink-900 uppercase tracking-wider">Messages Trend</div>
      </div>
      <div className="px-2 md:px-4 pb-4 md:pb-5">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
          {/* Grid lines */}
          {Array.from({ length: 5 }).map((_, i) => {
            const y = padding + (i * (height - padding * 2)) / 4;
            return <line key={i} x1={padding} x2={width - padding} y1={y} y2={y} stroke="rgba(15,23,42,0.06)" />;
          })}

          {allDatasets.map((ds: any, idx: number) => {
            const xStep = ds.points.length > 1 ? (width - padding * 2) / (ds.points.length - 1) : 0;
            const coords = ds.points.map((p: any, i: number) => {
              const x = padding + i * xStep;
              const y = padding + (1 - (p.y / maxY)) * (height - padding * 2);
              return { x, y };
            });

            const d = coords.map((c: any, i: number) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
            const fillD = `${d} L ${(padding + (ds.points.length - 1) * xStep).toFixed(1)} ${(height - padding).toFixed(1)} L ${padding.toFixed(1)} ${(height - padding).toFixed(1)} Z`;

            return (
              <React.Fragment key={idx}>
                <path d={fillD} fill={ds.fill} className="transition-all duration-500" />
                <path d={d} fill="none" stroke={ds.stroke} strokeWidth={3} className="md:stroke-[4]" />
                {coords.map((c: any, i: number) => (
                  <circle key={i} cx={c.x} cy={c.y} r={4} fill={ds.stroke} className="md:r-[6]" />
                ))}
              </React.Fragment>
            );
          })}

          {/* X Labels - Increased size */}
          {allDatasets[0].points.map((p: any, i: number) => {
            const xStep = (width - padding * 2) / (allDatasets[0].points.length - 1);
            const x = padding + i * xStep;
            return (
              <text
                key={i}
                x={x}
                y={height - 6}
                textAnchor={i === 0 ? "start" : i === allDatasets[0].points.length - 1 ? "end" : "middle"}
                fontSize="13"
                className="font-bold md:text-[15px]"
                fill="rgba(15,23,42,0.6)"
              >
                {p.xLabel}
              </text>
            );
          })}
        </svg>

        {/* Legend for Overview (only if datasets NOT provided) */}
        {showLegend && !datasets && (
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-ink-800/60">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#94a3b8" }} /> queued
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#22c55e" }} /> sent
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#3b82f6" }} /> delivered
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#16a34a" }} /> read
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#ef4444" }} /> failed
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function BlockSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded-[5px] bg-slate-100" />
      ))}
    </div>
  );
}

function downloadCsv(filename: string, rows: Array<Record<string, any>>) {
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const escape = (v: any) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function CampaignDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [templatePreviewProps, setTemplatePreviewProps] = useState<any | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [creditUsage, setCreditUsage] = useState<{ net: number; currency: string } | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const tab = (searchParams.get("tab") as TabId) || "overview";
  const setTab = (next: TabId) => setSearchParams((prev) => {
    const p = new URLSearchParams(prev);
    p.set("tab", next);
    return p;
  });

  const [itemsLoading, setItemsLoading] = useState(false);
  const [items, setItems] = useState<CampaignMessageItem[]>([]);
  const [replies, setReplies] = useState<ReplyItem[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [retryModalOpen, setRetryModalOpen] = useState(false);
  const [retryTemplates, setRetryTemplates] = useState<TemplateRecord[]>([]);
  const [retrySeed, setRetrySeed] = useState<{ name: string; phones: string[] } | null>(null);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsTotal, setItemsTotal] = useState(0);
  const ITEMS_PER_PAGE = 50;

  const tabGraphValue = tab === "overview" ? 0 : itemsTotal;

  const audienceTotal = metrics?.audienceTotal ?? campaign?.totals?.total ?? 0;

  const tabMeta = useMemo(() => {
    const c = metrics?.counts || {
      queued: 0,
      accepted: 0,
      sent: campaign?.totals?.sent || 0,
      delivered: 0,
      read: 0,
      failed: campaign?.totals?.failed || 0,
      replied: 0,
    };

    return [
      { id: "overview" as const, label: "Overview", Icon: Send, count: audienceTotal, tone: "neutral" as const },
      { id: "sent" as const, label: "Sent", Icon: CheckCircle2, count: c.sent, tone: "good" as const },
      { id: "delivered" as const, label: "Delivered", Icon: CheckCheck, count: c.delivered, tone: "neutral" as const },
      { id: "read" as const, label: "Read", Icon: Eye, count: c.read, tone: "neutral" as const },
      { id: "replied" as const, label: "Replied", Icon: MessageCircle, count: c.replied, tone: "neutral" as const },
      { id: "failed" as const, label: "Failed", Icon: XCircle, count: c.failed, tone: "bad" as const },
    ];
  }, [metrics?.counts, campaign?.totals?.sent, campaign?.totals?.failed, audienceTotal]);

  async function loadCampaign() {
    if (!id) return;
    if (!campaign) setLoading(true);
    setSyncing(true);
    try {
      const cRes = await API.campaigns.get(id);
      setCampaign(cRes?.campaign || null);
      setLoading(false);

      const templateId = cRes?.campaign?.templateId;
      const [mRes, creditRes, tRes] = await Promise.allSettled([
        API.campaigns.metrics(id),
        API.campaigns.creditUsage(id),
        templateId ? API.templates.get(templateId) : Promise.resolve(null),
      ]);

      if (mRes.status === "fulfilled" && mRes.value?.success) {
        setMetrics(mRes.value);
      }

      if (creditRes.status === "fulfilled" && creditRes.value?.success) {
        setCreditUsage({
          net: Number(creditRes.value?.net || 0),
          currency: String(creditRes.value?.currency || "INR"),
        });
      }

      if (tRes.status === "fulfilled") {
        const tpl = tRes.value?.template || null;
        setTemplateName(String(tpl?.name || ""));
        // keep template name on campaign object too (used by overview card)
        setCampaign((prev) => (prev ? { ...prev, templateName: String(tpl?.name || "") } : prev));
        const parsed = parseComponentsForPreview(tpl?.components || []);
        setTemplatePreviewProps({
          category: tpl?.category || "utility",
          headerType: parsed.headerType,
          headerText: parsed.headerText,
          mediaHandle: parsed.mediaHandle,
          headerLocation: parsed.headerLocation,
          bodyText: parsed.bodyText,
          footerText: parsed.footerText,
          ctaButtons: parsed.ctaButtons,
          variableValues: {},
          headerVariableValues: {},
          authConfig: parsed.authConfig,
        });
      } else {
        setTemplateName("");
        setTemplatePreviewProps(null);
      }
      if (!loading) toast("Campaign details updated", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to load campaign detail", "error");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    void loadCampaign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setItems([]);
    setReplies([]);
    setSelected({});
    setItemsPage(1);
    setItemsTotal(0);
    setStatusMenuOpen(false);
  }, [tab]);

  useEffect(() => {
    if (!id) return;
    if (tab === "overview") return;
    setItemsLoading(true);
    (async () => {
      try {
        if (tab === "replied") {
          const res = await API.campaigns.replies(id, { page: itemsPage, limit: ITEMS_PER_PAGE });
          setReplies(Array.isArray(res?.items) ? res.items : []);
          setItemsTotal(res?.total || 0);
          setItems([]);
          return;
        }
        const res = await API.campaigns.messages(id, { tab, page: itemsPage, limit: ITEMS_PER_PAGE });
        setItems(Array.isArray(res?.items) ? res.items : []);
        setItemsTotal(res?.total || 0);
        setReplies([]);
      } catch (e: any) {
        toast(e?.response?.data?.message || "Failed to load campaign data", "error");
      } finally {
        setItemsLoading(false);
      }
    })();
  }, [id, tab, itemsPage]);

  if (loading) {
    return <CampaignDetailSkeleton />;
  }

  if (!campaign) return <div className="p-6"><Alert tone="error">Campaign not found</Alert></div>;

  const counts = metrics?.counts;
  const createdAt = campaign.createdAt ? new Date(campaign.createdAt) : null;

  const selectedPhones = Object.keys(selected).filter((k) => selected[k]);
  const failedPhones = items.map((x) => x.phone);
  const allFailedSelected = failedPhones.length > 0 && failedPhones.every((p) => selected[p]);

  const exportFailed = () => {
    const rows = items
      .filter((it) => selected[it.phone])
      .map((it) => ({
        phone: it.phone,
        name: it.name,
        status: it.status,
        error: it.error?.message || it.error?.error?.message || "",
      }));
    downloadCsv(`campaign_failed_${campaign._id.slice(-8)}.csv`, rows);
  };

  const createRetryBroadcast = async () => {
    if (!id) return;
    if (!selectedPhones.length) return;
    setBusy(true);
    try {
      const tRes = await API.templates.list();
      setRetryTemplates(tRes?.templates || []);
      setRetrySeed({
        name: `Retry - ${campaign.name}`.slice(0, 140),
        phones: selectedPhones,
      });
      setRetryModalOpen(true);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to load templates", "error");
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (action: "pause" | "resume" | "stop" | "complete") => {
    if (!id) return;
    setBusy(true);
    try {
      await API.campaigns.action(id, action);
      const actionLabel = action === "stop" ? "canceled" : action === "complete" ? "completed" : `${action}d`;
      toast(`Campaign ${actionLabel} successfully.`, "success");
      await loadCampaign();
    } catch (e: any) {
      toast(e?.response?.data?.message || "Unable to update campaign status", "error");
    } finally {
      setBusy(false);
    }
  };

  const currentStatus = String(campaign.status || "").toLowerCase();
  const isApiCampaign = String(campaign.type || "").toLowerCase() === "api";
  const isCanceled = ["canceled", "cancelled"].includes(currentStatus);
  const isPaused = currentStatus === "paused";
  const isLive = currentStatus === "running";
  const allowPause = isLive;
  const allowResume = isPaused;
  const allowStop = isLive || isPaused;
  const allowComplete = isLive && isApiCampaign;
  const hasStatusActions = allowPause || allowResume || allowStop || allowComplete;

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#F8FAFC]">
      {/* Header */}
      <div className="sticky top-0 z-30 w-full bg-white border-b border-ink-900/5 shadow-sm">
        <div className="px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0 flex-nowrap">
              <button
                onClick={() => navigate("/app/send")}
                className="p-2.5 rounded-[5px] bg-white border border-ink-900/10 text-ink-900 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-2xl sm:text-3xl font-black text-ink-900 tracking-tight">
                  {campaign.name}
                </h1>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={loadCampaign}
              disabled={loading || syncing}
              className="gap-2 cursor-pointer border border-ink-900/10 bg-white px-2.5 sm:px-4"
            >
              <RefreshCcw size={16} className={syncing ? "animate-spin" : "Refresh"} />
              <span className="hidden xs:inline">{syncing ? "Syncing..." : "Refresh"}</span>
            </Button>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="flex flex-nowrap gap-2 overflow-x-auto no-scrollbar">
            {tabMeta.map((t) => {
              const active = tab === t.id;
              const total = audienceTotal || 0;
              const percent = t.id === "overview" ? 100 : pct(t.count, total);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={[
                    "group flex shrink-0 items-center gap-3 cursor-pointer px-4 py-3 border-b transition-colors",
                    active ? "border-brand-400 bg-brand-50/40" : "border-ink-900/10 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex flex-col items-start">
                    <div className="text-sm font-black text-ink-900">
                      {percent}% <span className="text-ink-800/40 font-semibold">({t.count})</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs font-bold text-ink-800/60">
                      <t.Icon size={14} />
                      {t.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {campaign.lastError?.message ? (
          <Alert tone="warn">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span className="font-semibold">Last error:</span> {campaign.lastError.message}
            </div>
          </Alert>
        ) : null}

        <div className={cn(
          "grid gap-6 md:gap-8",
          tab === "overview" ? "lg:grid-cols-[360px_minmax(0,1fr)]" : "lg:grid-cols-1",
          "items-start w-full"
        )}>
          {/* Left sticky: template preview (Overview only) */}
          {tab === "overview" ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 order-1 lg:order-1 w-full flex flex-col items-center"
            >
              <Card className="p-4 md:p-6 border-ink-900/5 shadow-xl shadow-ink-900/5 w-full max-w-full">
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-800/40 mb-1">Campaign Type</div>
                    <div className="text-base font-black text-ink-900 uppercase">{campaign.type || "broadcast"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-800/40 mb-1">Created At</div>
                    <div className="text-sm font-semibold text-ink-900/80">{createdAt ? createdAt.toLocaleString() : "—"}</div>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-800/40 mb-1">Template Name</div>
                    <div className="text-sm font-semibold text-ink-900/80 truncate" title={templateName}>{templateName || "—"}</div>
                  </div>
                </div>
              </Card>

              <Card className="py-2 border-ink-900/5 shadow-xl shadow-ink-900/5 overflow-hidden w-full flex justify-center bg-slate-50/50">
                <div className="w-full max-w-[300px]">
                  {templatePreviewProps ? (
                    <TemplatePreview {...templatePreviewProps} />
                  ) : (
                    <div className="mx-4 my-4 rounded-[5px] border border-ink-900/10 bg-slate-50 px-5 py-4 text-sm text-ink-800/70 text-center">
                      Template preview unavailable.
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ) : null}

          {/* Main Stats / Graph content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 order-2 lg:order-2 w-full"
          >
            {tab === "overview" ? (
              <Card className="p-4 md:p-6 border-ink-900/5 shadow-xl shadow-ink-900/5">
                <div className="grid grid-cols-3 gap-y-8 gap-x-2">
                  {/* Status Section */}
                  <div className="col-span-3 flex flex-col items-center border-b border-ink-900/5 pb-5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-800/40 mb-2">Campaign Status</div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-black text-ink-900 uppercase">
                        {isCanceled ? "canceled" : campaign.status || "queued"}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-10 w-10 p-0 border border-ink-900/10 bg-white shadow-sm"
                        onClick={() => setStatusMenuOpen((v) => !v)}
                        disabled={busy || !hasStatusActions}
                      >
                        {campaign.status === "paused" ? <Play size={18} /> : <Pause size={18} />}
                      </Button>
                      {statusMenuOpen && hasStatusActions && (
                        <div
                          ref={statusMenuRef}
                          className="absolute right-4 mt-2 w-44 z-50 overflow-hidden rounded-[5px] border border-ink-900/10 bg-white shadow-xl"
                        >
                          {allowResume ? (
                            <button
                              type="button"
                              className="w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-slate-50"
                              onClick={() => void runAction("resume")}
                            >
                              Resume
                            </button>
                          ) : allowPause ? (
                            <button
                              type="button"
                              className="w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-slate-50"
                              onClick={() => void runAction("pause")}
                            >
                              Pause
                            </button>
                          ) : null}
                          {allowStop ? (
                            <button
                              type="button"
                              className="w-full px-4 py-2.5 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
                              onClick={() => void runAction("stop")}
                            >
                              Cancel
                            </button>
                          ) : null}
                          {allowComplete ? (
                            <button
                              type="button"
                              className="w-full px-4 py-2.5 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                              onClick={() => void runAction("complete")}
                            >
                              Complete
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unified Metrics Grid (3 columns) */}
                  {[
                    { label: "Audience", value: audienceTotal },
                    { label: "Credit Used", value: creditUsage ? `${creditUsage.currency === "INR" ? "₹" : ""}${creditUsage.net.toFixed(1)}` : "—" },
                    { label: "Sent", value: counts?.sent || 0 },
                    { label: "Delivered", value: counts?.delivered || 0 },
                    { label: "Read", value: counts?.read || 0 },
                    { label: "Replied", value: counts?.replied || 0 },
                    { label: "Failed", value: counts?.failed || 0 },
                    { label: "Queued", value: counts?.queued || 0 },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col items-center text-center min-w-0">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-ink-800/40 mb-1.5 truncate w-full">{s.label}</div>
                      <div className="text-base md:text-2xl font-black text-ink-900 truncate w-full">
                        {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Graph Section - Overall metrics */}
                <div className="mt-8 border-t border-ink-900/5 pt-8">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-ink-800/60 uppercase">Sent</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-bold text-ink-800/60 uppercase">Delivered</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-[10px] font-bold text-ink-800/60 uppercase">Failed</span>
                    </div>
                  </div>
                  <AreaChart
                    datasets={[
                      {
                        points: [{ xLabel: "Yesterday", y: 0 }, { xLabel: "Today", y: counts?.sent || 0 }],
                        stroke: "#10b981",
                        fill: "rgba(16,185,129,0.12)"
                      },
                      {
                        points: [{ xLabel: "Yesterday", y: 0 }, { xLabel: "Today", y: counts?.delivered || 0 }],
                        stroke: "#3b82f6",
                        fill: "rgba(59,130,246,0.1)"
                      },
                      {
                        points: [{ xLabel: "Yesterday", y: 0 }, { xLabel: "Today", y: counts?.failed || 0 }],
                        stroke: "#ef4444",
                        fill: "rgba(239,68,68,0.08)"
                      }
                    ]}
                  />
                </div>
              </Card>
            ) : (
              <Card className="p-4 md:p-6 border-ink-900/5 shadow-xl shadow-ink-900/5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-800/50">Campaign Log</div>
                    <div className="mt-1 text-xl font-black text-ink-900 capitalize">{tab}</div>
                  </div>
                  {tab === "failed" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={exportFailed}
                        disabled={itemsLoading || selectedPhones.length === 0}
                        className="gap-2 border border-ink-900/10 bg-white"
                      >
                        <Download size={16} /> Export ({selectedPhones.length})
                      </Button>
                      <Button
                        onClick={createRetryBroadcast}
                        disabled={busy || itemsLoading || selectedPhones.length === 0}
                        className="gap-2"
                      >
                        <Send size={16} /> Create Broadcast
                      </Button>
                    </div>
                  ) : null}
                </div>

                {/* Main table data below metrics */}
                {itemsLoading ? (
                  <BlockSkeleton rows={7} />
                ) : tab === "replied" ? (
                  <div className="divide-y divide-ink-900/10 rounded-[5px] border border-ink-900/10 bg-white">
                    {replies.length === 0 ? (
                      <div className="px-4 py-10 text-center text-sm text-ink-800/70">No replies found yet.</div>
                    ) : (
                      replies.map((r) => (
                        <div key={r.phone} className="px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate font-bold text-ink-900">{r.name || r.phone}</div>
                              <div className="truncate text-xs text-ink-800/60">{r.phone}</div>
                            </div>
                            <div className="text-xs font-semibold text-ink-800/55">{new Date(r.createdAt).toLocaleString()}</div>
                          </div>
                          {r.text ? <div className="mt-2 text-sm text-ink-900/80">{r.text}</div> : null}
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[5px] border border-ink-900/10 bg-white">
                    <div className="grid grid-cols-[auto_1fr_140px] gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-ink-800/55 bg-slate-50 border-b border-ink-900/10">
                      {tab === "failed" ? (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={allFailedSelected}
                            onChange={() => {
                              const next = { ...selected };
                              if (allFailedSelected) {
                                failedPhones.forEach((p) => delete next[p]);
                              } else {
                                failedPhones.forEach((p) => { next[p] = true; });
                              }
                              setSelected(next);
                            }}
                          />
                          <span>Select</span>
                        </label>
                      ) : (
                        <div>#</div>
                      )}
                      <div>Contact</div>
                      <div>Status</div>
                    </div>

                    {items.length === 0 ? (
                      <div className="px-4 py-10 text-center text-sm text-ink-800/70">No data.</div>
                    ) : (
                      <div className="divide-y divide-ink-900/10">
                        {items.map((it, idx) => (
                          <div key={it.id} className="grid grid-cols-[auto_1fr_140px] gap-3 px-4 py-3 items-center">
                            {tab === "failed" ? (
                              <input
                                type="checkbox"
                                checked={!!selected[it.phone]}
                                onChange={() => setSelected((prev) => ({ ...prev, [it.phone]: !prev[it.phone] }))}
                              />
                            ) : (
                              <div className="text-xs font-bold text-ink-800/45">{idx + 1}</div>
                            )}
                            <div className="min-w-0">
                              <div className="truncate font-bold text-ink-900">{it.name || it.phone}</div>
                              <div className="truncate text-xs text-ink-800/60">{it.phone}</div>
                              {tab === "failed" && it.error ? (
                                <div className="mt-1 truncate text-xs text-rose-700">
                                  {String(
                                    it.error?.providerError ||
                                    it.error?.message ||
                                    it.error?.metaDebug?.meta?.error_user_msg ||
                                    it.error?.metaDebug?.meta?.message ||
                                    it.error?.metaDebug?.raw?.error?.error_data?.details ||
                                    it.error?.error?.message ||
                                    "Failed"
                                  )}
                                </div>
                              ) : null}
                            </div>
                            <div className="justify-self-end">
                              <Badge tone={tab === "failed" ? "bad" : "neutral"}>{it.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {itemsTotal > ITEMS_PER_PAGE && (
                      <div className="flex items-center justify-between border-t border-ink-900/10 bg-slate-50/50 px-4 py-3">
                        <div className="text-xs font-semibold text-ink-800/50">
                          Showing {Math.min(itemsTotal, (itemsPage - 1) * ITEMS_PER_PAGE + 1)}-{Math.min(itemsTotal, itemsPage * ITEMS_PER_PAGE)} of {itemsTotal}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={itemsPage === 1 || itemsLoading}
                            onClick={() => setItemsPage(p => Math.max(1, p - 1))}
                            className="h-8 w-8 p-0 border border-ink-900/10 bg-white"
                          >
                            <ChevronLeft size={16} />
                          </Button>
                          <div className="text-xs font-bold text-ink-900 min-w-[3rem] text-center">
                            Page {itemsPage}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={itemsPage * ITEMS_PER_PAGE >= itemsTotal || itemsLoading}
                            onClick={() => setItemsPage(p => p + 1)}
                            className="h-8 w-8 p-0 border border-ink-900/10 bg-white"
                          >
                            <ChevronRight size={16} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6">
                  {tab === "sent" ? (
                    <AreaChart
                      points={[{ xLabel: "Yesterday", y: 0 }, { xLabel: "Today", y: tabGraphValue }]}
                      stroke="#22c55e"
                      fill="rgba(34,197,94,0.2)"
                      showLegend={false}
                    />
                  ) : tab === "delivered" ? (
                    <AreaChart
                      points={[{ xLabel: "Yesterday", y: 0 }, { xLabel: "Today", y: tabGraphValue }]}
                      stroke="#3b82f6"
                      fill="rgba(59,130,246,0.18)"
                      showLegend={false}
                    />
                  ) : tab === "read" ? (
                    <AreaChart
                      points={[{ xLabel: "Yesterday", y: 0 }, { xLabel: "Today", y: tabGraphValue }]}
                      stroke="#16a34a"
                      fill="rgba(22,163,74,0.18)"
                      showLegend={false}
                    />
                  ) : tab === "failed" ? (
                    <AreaChart
                      points={[{ xLabel: "Yesterday", y: 0 }, { xLabel: "Today", y: tabGraphValue }]}
                      stroke="#ef4444"
                      fill="rgba(239,68,68,0.14)"
                      showLegend={false}
                    />
                  ) : (
                    <AreaChart
                      points={[{ xLabel: "Yesterday", y: 0 }, { xLabel: "Today", y: tabGraphValue }]}
                      stroke="#0ea5e9"
                      fill="rgba(14,165,233,0.14)"
                      showLegend={false}
                    />
                  )}
                </div>
              </Card>
            )}
          </motion.div>
        </div>
        <CampaignCreateModal
          isOpen={retryModalOpen}
          onClose={() => {
            setRetryModalOpen(false);
            setRetrySeed(null);
          }}
          onSuccess={async () => {
            await loadCampaign();
          }}
          templates={retryTemplates}
          contacts={[]}
          initialType={retrySeed ? "broadcast" : undefined}
          initialSelectedPhones={retrySeed ? retrySeed.phones : undefined}
          initialName={retrySeed ? retrySeed.name : undefined}
          lockRecipients={!!retrySeed}
        />
      </div>
    </div>
  );
}
