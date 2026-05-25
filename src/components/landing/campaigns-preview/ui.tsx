import { motion } from "framer-motion";
import { RefreshCcw, ShieldCheck } from "lucide-react";
import type { Campaign } from "./types";

export function toneClasses(tone: Campaign["statusTone"]) {
  if (tone === "success") return "bg-[#25D366]/12 text-[#0b6b2f] border-[#25D366]/25";
  if (tone === "warning") return "bg-[#f59e0b]/12 text-[#92400e] border-[#f59e0b]/25";
  return "bg-[#06b6d4]/12 text-[#075985] border-[#06b6d4]/25";
}

export function SkeletonCampaignCard() {
  return <div className="rounded-2xl border border-ink-900/10 bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="skeleton-bar h-3 w-32" /><div className="mt-2 skeleton-bar h-2.5 w-44 opacity-90" /></div><div className="skeleton-bar h-6 w-16 rounded-full" /></div><div className="mt-4 grid grid-cols-2 gap-3"><div><div className="skeleton-bar h-2.5 w-16 opacity-80" /><div className="mt-1.5 skeleton-bar h-3 w-24" /></div><div><div className="skeleton-bar h-2.5 w-16 opacity-80" /><div className="mt-1.5 skeleton-bar h-3 w-24" /></div></div><div className="mt-4 skeleton-bar h-2.5 w-28 opacity-80" /></div>;
}

export function CampaignCard({ campaign, index, inView }: { campaign: Campaign; index: number; inView: boolean }) {
  return <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.15 + index * 0.06, duration: 0.45 }} className="rounded-2xl border border-ink-900/10 bg-white p-4 hover:border-brand-300/40 transition-colors"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-bold text-ink-900 truncate">{campaign.name}</p><p className="mt-1 text-xs text-ink-900/55 truncate">Template: {campaign.template}</p></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${toneClasses(campaign.statusTone)}`}>{campaign.statusLabel}</span></div><div className="mt-4 grid grid-cols-2 gap-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-ink-900/45">Audience</p><p className="mt-1 text-xs font-semibold text-ink-900">{campaign.audienceLabel}</p></div><div><p className="text-[10px] font-bold uppercase tracking-widest text-ink-900/45">Delivered</p><p className="mt-1 text-xs font-semibold text-ink-900">{campaign.deliveredLabel}</p></div></div><div className="mt-4 flex items-center justify-between gap-2"><p className="text-[11px] text-ink-900/55">{campaign.updatedLabel}</p><div className="flex items-center gap-2 text-[11px] text-ink-900/55"><ShieldCheck className="h-3.5 w-3.5" /><span>Verified</span></div></div></motion.div>;
}

export function EmptyState({ title, desc, onRetry }: { title: string; desc: string; onRetry?: () => void }) {
  return <div className="rounded-2xl border border-ink-900/10 bg-white p-5"><p className="text-sm font-bold text-ink-900">{title}</p><p className="mt-1 text-xs text-ink-900/60">{desc}</p>{onRetry ? <button type="button" onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-slate-50 px-3 py-2 text-xs font-semibold text-ink-900 hover:border-brand-300/40 hover:bg-brand-50 transition-colors"><RefreshCcw className="h-4 w-4" />Retry</button> : null}</div>;
}
