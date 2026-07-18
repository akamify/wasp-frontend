import { AlertCircle, ArrowLeft, CheckCheck, CheckCircle2, ChevronLeft, ChevronRight, Download, Eye, MessageCircle, Pause, Play, RefreshCcw, Send, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Alert } from "@components/ui/Alert";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { TemplatePreview } from "@pages/user/templates/TemplatePreview";
import { formatCurrencySafe } from "@shared/config/currency";
import { cn } from "@shared/utils/cn";
import { AreaChart, BlockSkeleton, pct } from "./helpers";
import type { Campaign, CampaignMessageItem, Metrics, ReplyItem, TabId, TabMetaItem } from "./types";

export function buildTabMeta(metrics: Metrics | null, campaign: Campaign | null, audienceTotal: number): TabMetaItem[] {
  const c = metrics?.counts || { queued: 0, accepted: 0, sent: campaign?.totals?.sent || 0, delivered: 0, read: 0, failed: campaign?.totals?.failed || 0, replied: 0 };
  return [
    { id: "overview", label: "Overview", Icon: Send, count: audienceTotal, tone: "neutral" },
    { id: "sent", label: "Sent", Icon: CheckCircle2, count: c.sent, tone: "good" },
    { id: "delivered", label: "Delivered", Icon: CheckCheck, count: c.delivered, tone: "neutral" },
    { id: "read", label: "Read", Icon: Eye, count: c.read, tone: "neutral" },
    { id: "replied", label: "Replied", Icon: MessageCircle, count: c.replied, tone: "neutral" },
    { id: "failed", label: "Failed", Icon: XCircle, count: c.failed, tone: "bad" },
  ];
}

export function DetailHeader({ campaign, tabMeta, tab, audienceTotal, setTab, navigate, loadCampaign, loading, syncing }: any) {
  return (
    <div className="sticky top-0 z-30 w-full bg-white border-b border-ink-900/5 shadow-sm">
      <div className="px-4 py-3 md:py-4"><div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0 flex-nowrap">
          <button onClick={() => navigate("/app/send")} className="p-2.5 rounded-[5px] bg-white border border-ink-900/10 text-ink-900 hover:bg-slate-50 transition-colors cursor-pointer"><ArrowLeft size={20} /></button>
          <div className="min-w-0"><h1 className="truncate text-2xl sm:text-3xl font-black text-ink-900 tracking-tight">{campaign.name}</h1></div>
        </div>
        <Button variant="ghost" onClick={loadCampaign} disabled={loading || syncing} className="gap-2 cursor-pointer border border-ink-900/10 bg-white px-2.5 sm:px-4">
          <RefreshCcw size={16} className={syncing ? "animate-spin" : "Refresh"} />
          <span className="hidden xs:inline">{syncing ? "Syncing..." : "Refresh"}</span>
        </Button>
      </div></div>
      <div className="px-4 pb-3"><div className="flex flex-nowrap gap-2 overflow-x-auto no-scrollbar">
        {tabMeta.map((t: TabMetaItem) => {
          const active = tab === t.id;
          const percent = t.id === "overview" ? 100 : pct(t.count, audienceTotal || 0);
          return (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} className={["group flex shrink-0 items-center gap-3 cursor-pointer px-4 py-3 border-b transition-colors", active ? "border-brand-400 bg-brand-50/40" : "border-ink-900/10 hover:bg-slate-50"].join(" ")}>
              <div className="flex flex-col items-start">
                <div className="text-sm font-black text-ink-900">{percent}% <span className="text-ink-800/40 font-semibold">({t.count})</span></div>
                <div className="mt-0.5 flex items-center gap-2 text-xs font-bold text-ink-800/60"><t.Icon size={14} />{t.label}</div>
              </div>
            </button>
          );
        })}
      </div></div>
    </div>
  );
}

export function LeftOverviewPanel({ campaign, createdAt, templateName, templatePreviewProps }: any) {
  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 order-1 lg:order-1 w-full flex flex-col items-center">
    <Card className="p-4 md:p-6 border-ink-900/5 shadow-xl shadow-ink-900/5 w-full max-w-full">
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
        <div><div className="text-[10px] font-bold uppercase tracking-wider text-ink-800/40 mb-1">Campaign Type</div><div className="text-base font-black text-ink-900 uppercase">{campaign.type || "broadcast"}</div></div>
        <div><div className="text-[10px] font-bold uppercase tracking-wider text-ink-800/40 mb-1">Created At</div><div className="text-sm font-semibold text-ink-900/80">{createdAt ? createdAt.toLocaleString() : "--"}</div></div>
        <div className="col-span-2 lg:col-span-1"><div className="text-[10px] font-bold uppercase tracking-wider text-ink-800/40 mb-1">Template Name</div><div className="text-sm font-semibold text-ink-900/80 truncate" title={templateName}>{templateName || "--"}</div></div>
      </div>
    </Card>
    <Card className="py-2 border-ink-900/5 shadow-xl shadow-ink-900/5 overflow-hidden w-full flex justify-center bg-slate-50/50"><div className="w-full max-w-[300px]">{templatePreviewProps ? <TemplatePreview {...templatePreviewProps} /> : <div className="mx-4 my-4 rounded-[5px] border border-ink-900/10 bg-slate-50 px-5 py-4 text-sm text-ink-800/70 text-center">Template preview unavailable.</div>}</div></Card>
  </motion.div>;
}

export function OverviewCard(props: any) {
  const { campaign, counts, analytics, audienceTotal, creditUsage, isCanceled, statusMenuOpen, setStatusMenuOpen, hasStatusActions, busy, allowPause, allowResume, allowStop, allowComplete, runAction, statusMenuRef } = props;
  const revenue = Number(analytics?.revenue || 0);
  const spend = Number(analytics?.spend || creditUsage?.net || 0);
  const roi = analytics?.roi;
  return <Card className="p-4 md:p-6 border-ink-900/5 shadow-xl shadow-ink-900/5">
    <div className="grid grid-cols-3 gap-y-8 gap-x-2">
      <div className="col-span-3 flex flex-col items-center border-b border-ink-900/5 pb-5"><div className="text-[10px] font-bold uppercase tracking-wider text-ink-800/40 mb-2">Campaign Status</div><div className="flex items-center gap-2">
        <div className="text-sm font-black text-ink-900 uppercase">{isCanceled ? "canceled" : campaign.status || "queued"}</div>
        <Button type="button" size="sm" variant="ghost" className="h-10 w-10 p-0 border border-ink-900/10 bg-white shadow-sm" onClick={() => setStatusMenuOpen((v: boolean) => !v)} disabled={busy || !hasStatusActions}>{campaign.status === "paused" ? <Play size={18} /> : <Pause size={18} />}</Button>
        {statusMenuOpen && hasStatusActions ? <div ref={statusMenuRef} className="absolute right-4 mt-2 w-44 z-50 overflow-hidden rounded-[5px] border border-ink-900/10 bg-white shadow-xl">
          {allowResume ? <button type="button" className="w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-slate-50" onClick={() => void runAction("resume")}>Resume</button> : allowPause ? <button type="button" className="w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-slate-50" onClick={() => void runAction("pause")}>Pause</button> : null}
          {allowStop ? <button type="button" className="w-full px-4 py-2.5 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50" onClick={() => void runAction("stop")}>Cancel</button> : null}
          {allowComplete ? <button type="button" className="w-full px-4 py-2.5 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-50" onClick={() => void runAction("complete")}>Complete</button> : null}
        </div> : null}
      </div></div>
      {[{ label: "Audience", value: audienceTotal }, { label: "Credit Used", value: creditUsage ? formatCurrencySafe(Number(creditUsage.net || 0), creditUsage.currency || "INR") : "--" }, { label: "Sent", value: counts?.sent || analytics?.sent || 0 }, { label: "Delivered", value: counts?.delivered || analytics?.delivered || 0 }, { label: "Read", value: counts?.read || analytics?.read || 0 }, { label: "Clicked", value: analytics?.clicked || 0 }, { label: "Converted", value: analytics?.converted || 0 }, { label: "Failed", value: counts?.failed || analytics?.failed || 0 }, { label: "Queued", value: counts?.queued || 0 }].map((s) => (
        <div key={s.label} className="flex flex-col items-center text-center min-w-0"><div className="text-[9px] font-bold uppercase tracking-wider text-ink-800/40 mb-1.5 truncate w-full">{s.label}</div><div className="text-base md:text-2xl font-black text-ink-900 truncate w-full">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</div></div>
      ))}
    </div>
    <div className="mt-8 grid gap-3 rounded-[5px] border border-ink-900/5 bg-slate-50/70 p-4 md:grid-cols-5">
      <MetricPill label="CTR" value={`${Number(analytics?.ctr || 0).toFixed(1)}%`} />
      <MetricPill label="Conversion Rate" value={`${Number(analytics?.conversionRate || 0).toFixed(1)}%`} />
      <MetricPill label="Revenue" value={formatCurrencySafe(Math.round(revenue), "INR")} />
      <MetricPill label="Spend" value={formatCurrencySafe(Math.round(spend), "INR")} />
      <MetricPill label="ROI" value={roi === null || roi === undefined ? "--" : `${(Number(roi) * 100).toFixed(0)}%`} />
    </div>
    <div className="mt-8 border-t border-ink-900/5 pt-8"><div className="flex flex-wrap items-center gap-4 mb-4"><div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-ink-800/60 uppercase">Sent</span></div><div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span className="text-[10px] font-bold text-ink-800/60 uppercase">Delivered</span></div><div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500" /><span className="text-[10px] font-bold text-ink-800/60 uppercase">Failed</span></div></div>
      <AreaChart datasets={[{ points: [{ xLabel: "Yesterday", y: 0 }, { xLabel: "Today", y: counts?.sent || 0 }], stroke: "#10b981", fill: "rgba(16,185,129,0.12)" }, { points: [{ xLabel: "Yesterday", y: 0 }, { xLabel: "Today", y: counts?.delivered || 0 }], stroke: "#3b82f6", fill: "rgba(59,130,246,0.1)" }, { points: [{ xLabel: "Yesterday", y: 0 }, { xLabel: "Today", y: counts?.failed || 0 }], stroke: "#ef4444", fill: "rgba(239,68,68,0.08)" }]} />
    </div>
  </Card>;
}

export function LogCard(props: any) {
  const { tab, itemsLoading, replies, items, allFailedSelected, failedPhones, selected, setSelected, itemsTotal, itemsPage, setItemsPage, ITEMS_PER_PAGE, selectedPhones, exportFailed, createRetryBroadcast, busy, tabGraphValue } = props;
  return <Card className="p-4 md:p-6 border-ink-900/5 shadow-xl shadow-ink-900/5">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6"><div><div className="text-xs font-semibold uppercase tracking-wider text-ink-800/50">Campaign Log</div><div className="mt-1 text-xl font-black text-ink-900 capitalize">{tab}</div></div>{tab === "failed" ? <div className="flex flex-wrap items-center gap-2"><Button variant="ghost" onClick={exportFailed} disabled={itemsLoading || selectedPhones.length === 0} className="gap-2 border border-ink-900/10 bg-white"><Download size={16} /> Export ({selectedPhones.length})</Button><Button onClick={createRetryBroadcast} disabled={busy || itemsLoading || selectedPhones.length === 0} className="gap-2"><Send size={16} /> Create Broadcast</Button></div> : null}</div>
    {itemsLoading ? <BlockSkeleton rows={7} /> : tab === "replied" ? <div className="divide-y divide-ink-900/10 rounded-[5px] border border-ink-900/10 bg-white">{replies.length === 0 ? <div className="px-4 py-10 text-center text-sm text-ink-800/70">No replies found yet.</div> : replies.map((r: ReplyItem) => <div key={r.phone} className="px-4 py-3"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="truncate font-bold text-ink-900">{r.name || r.phone}</div><div className="truncate text-xs text-ink-800/60">{r.phone}</div></div><div className="text-xs font-semibold text-ink-800/55">{new Date(r.createdAt).toLocaleString()}</div></div>{r.text ? <div className="mt-2 text-sm text-ink-900/80">{r.text}</div> : null}</div>)}</div> : <div className="overflow-hidden rounded-[5px] border border-ink-900/10 bg-white">
      <div className="grid grid-cols-[auto_1fr_140px] gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-ink-800/55 bg-slate-50 border-b border-ink-900/10">
        {tab === "failed" ? <label className="flex items-center gap-2"><input type="checkbox" checked={allFailedSelected} onChange={() => { const next = { ...selected }; if (allFailedSelected) { failedPhones.forEach((p: string) => delete next[p]); } else { failedPhones.forEach((p: string) => { next[p] = true; }); } setSelected(next); }} /><span>Select</span></label> : <div>#</div>}
        <div>Contact</div><div>Status</div>
      </div>
      {items.length === 0 ? <div className="px-4 py-10 text-center text-sm text-ink-800/70">No data.</div> : <div className="divide-y divide-ink-900/10">{items.map((it: CampaignMessageItem, idx: number) => <div key={it.id} className="grid grid-cols-[auto_1fr_140px] gap-3 px-4 py-3 items-center">{tab === "failed" ? <input type="checkbox" checked={!!selected[it.phone]} onChange={() => setSelected((prev: Record<string, boolean>) => ({ ...prev, [it.phone]: !prev[it.phone] }))} /> : <div className="text-xs font-bold text-ink-800/45">{idx + 1}</div>}<div className="min-w-0"><div className="truncate font-bold text-ink-900">{it.name || it.phone}</div><div className="truncate text-xs text-ink-800/60">{it.phone}</div>{tab === "failed" && it.error ? <div className="mt-1 truncate text-xs text-rose-700">{String(it.error?.providerError || it.error?.message || it.error?.metaDebug?.meta?.error_user_msg || it.error?.metaDebug?.meta?.message || it.error?.metaDebug?.raw?.error?.error_data?.details || it.error?.error?.message || "Failed")}</div> : null}</div><div className="justify-self-end"><Badge tone={tab === "failed" ? "bad" : "neutral"}>{it.status}</Badge></div></div>)}</div>}
      {itemsTotal > ITEMS_PER_PAGE ? <div className="flex items-center justify-between border-t border-ink-900/10 bg-slate-50/50 px-4 py-3"><div className="text-xs font-semibold text-ink-800/50">Showing {Math.min(itemsTotal, (itemsPage - 1) * ITEMS_PER_PAGE + 1)}-{Math.min(itemsTotal, itemsPage * ITEMS_PER_PAGE)} of {itemsTotal}</div><div className="flex items-center gap-2"><Button size="sm" variant="ghost" disabled={itemsPage === 1 || itemsLoading} onClick={() => setItemsPage((p: number) => Math.max(1, p - 1))} className="h-8 w-8 p-0 border border-ink-900/10 bg-white"><ChevronLeft size={16} /></Button><div className="text-xs font-bold text-ink-900 min-w-[3rem] text-center">Page {itemsPage}</div><Button size="sm" variant="ghost" disabled={itemsPage * ITEMS_PER_PAGE >= itemsTotal || itemsLoading} onClick={() => setItemsPage((p: number) => p + 1)} className="h-8 w-8 p-0 border border-ink-900/10 bg-white"><ChevronRight size={16} /></Button></div></div> : null}
    </div>}
    <div className="mt-6"><AreaChart points={[{ xLabel: "Yesterday", y: 0 }, { xLabel: "Today", y: tabGraphValue }]} stroke={tab === "sent" ? "#22c55e" : tab === "delivered" ? "#3b82f6" : tab === "read" ? "#16a34a" : tab === "failed" ? "#ef4444" : "#0ea5e9"} fill={tab === "sent" ? "rgba(34,197,94,0.2)" : tab === "delivered" ? "rgba(59,130,246,0.18)" : tab === "read" ? "rgba(22,163,74,0.18)" : tab === "failed" ? "rgba(239,68,68,0.14)" : "rgba(14,165,233,0.14)"} showLegend={false} /></div>
  </Card>;
}

export function LastErrorBanner({ campaign }: { campaign: Campaign }) {
  if (!campaign.lastError?.message) return null;
  return <Alert tone="warn"><div className="flex items-center gap-2"><AlertCircle size={16} /><span className="font-semibold">Last error:</span> {campaign.lastError.message}</div></Alert>;
}

export function MainGrid({ tab, children }: { tab: TabId; children: React.ReactNode }) {
  return <div className={cn("grid gap-6 md:gap-8", tab === "overview" ? "lg:grid-cols-[360px_minmax(0,1fr)]" : "lg:grid-cols-1", "items-start w-full")}>{children}</div>;
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[5px] bg-white px-3 py-3 text-center shadow-sm">
      <div className="text-[10px] font-black uppercase tracking-widest text-ink-800/40">{label}</div>
      <div className="mt-1 text-lg font-black text-ink-900">{value}</div>
    </div>
  );
}
