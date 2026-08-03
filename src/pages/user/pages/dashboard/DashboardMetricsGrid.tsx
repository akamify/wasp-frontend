import { Calendar, Eye, FileText, IndianRupee, Megaphone, MessageCircle, MousePointerClick, Repeat, Send, TrendingDown, TrendingUp, Users, XCircle } from "lucide-react";
import { Card } from "@components/ui/Card";
import { cn } from "@shared/utils/cn";

export function DashboardMetricsGrid({ analytics, sent, delivered, read, contactsUp, contactsGrowth, monthlyUp, monthly }: any) {
  const clicked = Number(analytics?.overview?.clicked || 0);
  const converted = Number(analytics?.overview?.converted || 0);
  const revenue = Number(analytics?.overview?.revenue || 0);
  const roi = analytics?.overview?.roi;
  const clickRatePct = Number(analytics?.rates?.clickRatePct || 0);
  const conversionRatePct = Number(analytics?.rates?.conversionRatePct || 0);

  const stats = [
    { label: "Contacts", value: Number(analytics?.counts?.contacts || 0), icon: Users, trendDir: contactsUp ? "up" : "down", trendValue: `${Math.abs(Number(contactsGrowth.pct || 0)).toFixed(1)}%`, tone: "blue" },
    { label: "Messages", value: sent, icon: MessageCircle, trendDir: monthlyUp ? "up" : "down", trendValue: `${Math.abs(Number(monthly.pct || 0)).toFixed(1)}%`, tone: "orange" },
    { label: "Sent", value: sent, icon: Send, trend: "Total", tone: "cyan" },
    { label: "Delivered", value: delivered, icon: TrendingUp, trend: Number(analytics?.rates?.deliveryRatePct || 0) >= 50 ? "Healthy" : "Needs work", tone: "violet" },
    { label: "Read", value: read, icon: Eye, trend: Number(analytics?.rates?.readRatePct || 0) >= 20 ? "Healthy" : "Needs work", tone: "green" },
    { label: "Clicked", value: clicked, icon: MousePointerClick, trend: `${clickRatePct.toFixed(1)}% CTR`, tone: "amber" },
    { label: "Converted", value: converted, icon: Repeat, trend: `${conversionRatePct.toFixed(1)}% CVR`, tone: "emerald" },
    { label: "Revenue", value: `Rs ${Math.round(revenue).toLocaleString()}`, icon: IndianRupee, trend: "Attributed", tone: "sky" },
    { label: "Failed", value: Number(analytics?.overview?.failed || 0), icon: XCircle, trend: "Watch", tone: "rose" },
    { label: "Campaigns", value: Number(analytics?.counts?.campaigns || 0), icon: Megaphone, trend: "Live", tone: "brand" },
    { label: "Templates", value: Number(analytics?.counts?.templates || 0), icon: FileText, trend: "Library", tone: "brand" },
    { label: "ROI", value: roi === null || roi === undefined ? "--" : `${(Number(roi) * 100).toFixed(0)}%`, icon: TrendingUp, trend: roi !== null && roi !== undefined && Number(roi) >= 0 ? "Positive" : "Watch", tone: "purple" },
    { label: "Today", value: Number(analytics?.today?.sent || 0), icon: Calendar, trend: "Messages today", tone: "slate" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat, index) => {
        const tone = toneClasses(stat.tone);
        return (
          <Card key={index} className="group rounded-[18px] border border-white/80 bg-white/95 p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.38)] transition-transform hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
                <h4 className="mt-2 truncate text-2xl font-black tracking-tight text-slate-900">{stat.value?.toLocaleString?.() ?? stat.value ?? "0"}</h4>
              </div>
              <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-[14px] transition-transform group-hover:scale-105", tone.bg, tone.text)}>
                <stat.icon size={18} />
              </div>
            </div>

            <div className="mt-4">
              <div className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]", tone.badge)}>
                {stat.trendDir ? (
                  <>
                    {stat.trendDir === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {stat.trendValue}
                  </>
                ) : (
                  <span>{stat.trend}</span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function toneClasses(tone: string) {
  switch (tone) {
    case "blue":
      return { bg: "bg-blue-50", text: "text-blue-700", badge: "bg-blue-50 text-blue-700" };
    case "orange":
      return { bg: "bg-orange-50", text: "text-orange-700", badge: "bg-orange-50 text-orange-700" };
    case "cyan":
      return { bg: "bg-cyan-50", text: "text-cyan-700", badge: "bg-cyan-50 text-cyan-700" };
    case "violet":
      return { bg: "bg-violet-50", text: "text-violet-700", badge: "bg-violet-50 text-violet-700" };
    case "green":
      return { bg: "bg-green-50", text: "text-green-700", badge: "bg-green-50 text-green-700" };
    case "amber":
      return { bg: "bg-amber-50", text: "text-amber-700", badge: "bg-amber-50 text-amber-700" };
    case "emerald":
      return { bg: "bg-emerald-50", text: "text-emerald-700", badge: "bg-emerald-50 text-emerald-700" };
    case "sky":
      return { bg: "bg-sky-50", text: "text-sky-700", badge: "bg-sky-50 text-sky-700" };
    case "rose":
      return { bg: "bg-rose-50", text: "text-rose-700", badge: "bg-rose-50 text-rose-700" };
    case "purple":
      return { bg: "bg-purple-50", text: "text-purple-700", badge: "bg-purple-50 text-purple-700" };
    case "brand":
      return { bg: "bg-brand-50", text: "text-brand-700", badge: "bg-brand-50 text-brand-700" };
    default:
      return { bg: "bg-slate-50", text: "text-slate-700", badge: "bg-slate-100 text-slate-700" };
  }
}
