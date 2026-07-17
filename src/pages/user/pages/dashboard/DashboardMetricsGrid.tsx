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
    { label: "Contacts", value: Number(analytics?.counts?.contacts || 0), icon: Users, trendDir: contactsUp ? "up" : "down", trendValue: `${Math.abs(Number(contactsGrowth.pct || 0)).toFixed(1)}%`, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Messages", value: sent, icon: MessageCircle, trendDir: monthlyUp ? "up" : "down", trendValue: `${Math.abs(Number(monthly.pct || 0)).toFixed(1)}%`, color: "text-[#ea580c]/60", bg: "bg-[#fff7ed]/50" },
    { label: "Sent", value: sent, icon: Send, trend: "Total", color: "text-[#0891b2]/60", bg: "bg-[#ecfeff]/50" },
    { label: "Delivered", value: delivered, icon: TrendingUp, trend: Number(analytics?.rates?.deliveryRatePct || 0) >= 50 ? "Good" : "Low", color: "text-[#7c3aed]/60", bg: "bg-[#f5f3ff]/50" },
    { label: "Read", value: read, icon: Eye, trend: Number(analytics?.rates?.readRatePct || 0) >= 20 ? "Good" : "Low", color: "text-green-600", bg: "bg-green-50" },
    { label: "Clicked", value: clicked, icon: MousePointerClick, trend: `${clickRatePct.toFixed(1)}% CTR`, color: "text-amber-700", bg: "bg-amber-50" },
    { label: "Converted", value: converted, icon: Repeat, trend: `${conversionRatePct.toFixed(1)}% CVR`, color: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "Revenue", value: `Rs ${Math.round(revenue).toLocaleString()}`, icon: IndianRupee, trend: "Attributed", color: "text-cyan-700", bg: "bg-cyan-50" },
    { label: "Failed", value: Number(analytics?.overview?.failed || 0), icon: XCircle, trend: "Watch", color: "text-red-600", bg: "bg-red-50" },
    { label: "Total Campaigns", value: Number(analytics?.counts?.campaigns || 0), icon: Megaphone, trend: "Live", color: "text-brand-600", bg: "bg-brand-50" },
    { label: "Templates", value: Number(analytics?.counts?.templates || 0), icon: FileText, trend: "Library", color: "text-brand-600", bg: "bg-brand-50" },
    { label: "ROI", value: roi === null || roi === undefined ? "--" : `${(Number(roi) * 100).toFixed(0)}%`, icon: TrendingUp, trend: roi !== null && roi !== undefined && Number(roi) >= 0 ? "Positive" : "Watch", color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Today's Messages", value: Number(analytics?.today?.sent || 0), icon: Calendar, trend: "Today", color: "text-brand-600", bg: "bg-brand-50" },
  ];

  return (
    <div className="grid gap-3 grid-cols-2">
      {stats.map((stat, i) => (
        <Card key={i} className="p-3 md:p-5 flex items-center justify-between group rounded-[5px]">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 truncate">{stat.label}</p>
            <h4 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight truncate">{stat.value?.toLocaleString() ?? "0"}</h4>
            <div className={cn("mt-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-[4px] inline-block", stat.bg, stat.color)}>
              {stat.trendDir ? (
                <span className={cn("inline-flex items-center gap-1", stat.trendDir === "up" ? "text-emerald-700" : "text-red-700")}>
                  {stat.trendDir === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {stat.trendValue}
                </span>
              ) : <span>{stat.trend}</span>}
            </div>
          </div>
          <div className={cn("p-2 md:p-3 rounded-[5px] transition-transform group-hover:scale-110 shrink-0 ml-2", stat.bg, stat.color)}>
            <stat.icon size={18} className="md:size-6" />
          </div>
        </Card>
      ))}
    </div>
  );
}
