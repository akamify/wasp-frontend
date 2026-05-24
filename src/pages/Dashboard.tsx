import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { DashboardSkeleton } from "@components/ui/Skeletons";

import { Button } from "@components/ui/Button";
import { Badge } from "@components/ui/Badge";
import { cn } from "@shared/utils/cn";
import { useToast } from "@shared/providers/ToastContext";

import {
  CheckCircle2, Circle, ArrowRight,
  ChevronDown, ChevronUp, Phone,
  TrendingUp, MessageSquare, Zap, Globe, Wallet, RefreshCw, Plus,
  MessageCircle,
  Users,
  Eye,
  Send,
  XCircle,
  Calendar,
  UtilityPole,
  Megaphone,
  FileText,
  TrendingDown,
  Grid,
  Boxes,
  LayoutDashboard,
} from "lucide-react";
import { WhatsAppManagerProfileModal } from "@pages/dashboard/WhatsAppManagerProfileModal";
import { WhatsAppManagerProfileViewModal } from "@pages/dashboard/WhatsAppManagerProfileViewModal";
import { RechargeModal } from "@components/wallet/RechargeModal";

import { formatCurrencySafe } from "@shared/config/currency";
const EMPTY_OVERVIEW = { sent: 0, delivered: 0, read: 0, failed: 0, clicks: 0 };
const EMPTY_ANALYTICS = {
  overview: EMPTY_OVERVIEW,
  rates: { deliveryRatePct: 0, readRatePct: 0 },
  growth: { monthly: { thisMonth: 0, lastMonth: 0, pct: 0 }, contacts: { thisWeek: 0, lastWeek: 0, pct: 0 } },
  counts: { campaigns: 0, templates: 0, contacts: 0 },
  today: { sent: 0 },
  series: { group: "day", points: [] as any[] },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const isInitialLoad = useRef(true);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [chartFilter, setChartFilter] = useState<"Today" | "Last 7 Days" | "30 Days">("Last 7 Days");

  const analyticsRange = useMemo(() => {
    if (chartFilter === "Today") return "today";
    if (chartFilter === "30 Days") return "30d";
    return "7d";
  }, [chartFilter]);

  const loadDashboard = useCallback(async () => {
    const isFirst = isInitialLoad.current;
    if (isFirst) setLoading(true);
    setSyncing(true);
    try {
      const results = await Promise.allSettled([
        API.analytics.overview({ range: "7d" }),
        API.templates.list(),
        API.contacts.list({ limit: 10 }),
        API.wallet.get(),
        API.wallet.history({ limit: 25 }).catch(() => null),
        API.meta.status().catch(() => null),
        API.campaigns.list({ limit: 5 }),
        API.billing.current().catch(() => null),
      ]);

      const walletHistory = results[4].status === "fulfilled" ? results[4].value : null;
      const transactions = Array.isArray(walletHistory?.transactions) ? walletHistory.transactions : [];
      const hasRechargedOnce = transactions.some((t: any) => {
        const type = String(t?.type || "").toLowerCase();
        const provider = String(t?.provider || "").toLowerCase();
        const reason = String(t?.reason || "").toLowerCase();
        return type === "credit" && (provider === "razorpay" || reason.includes("recharge"));
      });

      setSnapshot({
        analytics: results[0].status === "fulfilled" ? results[0].value : EMPTY_ANALYTICS,
        // Keep legacy field so old UI parts don't break.
        overview: results[0].status === "fulfilled" ? results[0].value.overview : EMPTY_OVERVIEW,
        templates: results[1].status === 'fulfilled' ? results[1].value.templates : [],
        contacts: results[2].status === 'fulfilled' ? results[2].value.contacts : [],
        wallet: results[3].status === 'fulfilled' ? results[3].value.wallet : { balance: 0, currency: 'INR' },
        walletHasRechargedOnce: hasRechargedOnce,
        meta: results[5].status === 'fulfilled' ? results[5].value : null,
        metaStatus: results[5].status === 'fulfilled' ? results[5].value?.status : "disconnected",
        campaigns: results[6].status === 'fulfilled' ? results[6].value.campaigns : [],
        billingCurrent: results[7].status === "fulfilled" ? results[7].value : null,
      });
      if (!isFirst) toast("Dashboard data updated", "success");
    } catch (e) {
      toast("Failed to sync dashboard", "error");
    } finally {
      setLoading(false);
      setSyncing(false);
      isInitialLoad.current = false;
    }
  }, [toast]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Refresh only analytics when range changes (cards + graph), without reloading whole dashboard.
  useEffect(() => {
    let active = true;
    if (!snapshot) return;
    setSyncing(true);
    API.analytics
      .overview({ range: analyticsRange })
      .then((r: any) => {
        if (!active) return;
        setSnapshot((prev: any) => (prev ? { ...prev, analytics: r, overview: r?.overview || prev.overview } : prev));
      })
      .catch(() => { })
      .finally(() => {
        if (!active) return;
        setSyncing(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyticsRange]);

  const steps = useMemo(() => [
    { id: 1, label: "Connect Meta Account", done: snapshot?.metaStatus === "active", href: "/app/meta" },
    { id: 2, label: "Create Template", done: snapshot?.templates?.some((t: any) => t.status === 'approved'), href: "/app/templates" },
    { id: 3, label: "Add Your Contacts", done: snapshot?.contacts?.length > 0, href: "/app/contacts" },
    { id: 4, label: "Add Wallet Balance", done: (snapshot?.wallet?.balance > 0) || !!snapshot?.walletHasRechargedOnce, href: "/app/wallet" },
    { id: 5, label: "Create Campaign", done: snapshot?.campaigns?.length > 0, href: "/app/send" },
  ], [snapshot]);

  const allStepsDone = useMemo(() => steps.length > 0 && steps.every((s) => s.done), [steps]);
  const [stepsExpanded, setStepsExpanded] = useState(true);

  // Auto-collapse steps if all are done once snapshot is loaded
  useEffect(() => {
    if (snapshot && allStepsDone) {
      setStepsExpanded(false);
    }
  }, [snapshot, allStepsDone]);

  const liveActivities = useMemo(() => {
    if (!snapshot) return [];
    const items: any[] = [];
    if (snapshot.campaigns) {
      snapshot.campaigns.forEach((c: any) => {
        const date = c.createdAt ? new Date(c.createdAt) : new Date();
        items.push({
          id: `camp-${c._id || Math.random()}`,
          type: "campaign",
          title: `Campaign "${c.name}" sent to ${c.totals?.total || 0} contacts`,
          time: date.toLocaleString([], { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          color: "bg-brand-500",
          timestamp: date.getTime()
        });
      });
    }
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [snapshot]);

  // Derived graph data (from backend analytics series)
  const graphData = useMemo(() => {
    const points = snapshot?.analytics?.series?.points;
    if (!Array.isArray(points) || !points.length) return [];
    return points.map((p: any) => ({
      label: String(p.label || ""),
      val: Number(p.sent || 0),
      delivered: Number(p.delivered || 0),
    }));
  }, [snapshot]);

  // Helper to generate SVG path
  const getPath = (data: any[], key: string, height: number, width: number) => {
    if (data.length < 2) return "";
    const maxVal = Math.max(...data.map((x) => Number(x?.[key] || 0)), 1);
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (d[key] / maxVal) * (height * 0.85);
      return { x, y };
    });

    // Cubic Bezier curve
    return points.reduce((acc, point, i, a) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      const prev = a[i - 1];
      const cx1 = prev.x + (point.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (point.x - prev.x) / 2;
      const cy2 = point.y;
      return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${point.x},${point.y}`;
    }, "");
  };

  if (loading && !snapshot) return <DashboardSkeleton />;

  const analytics = snapshot?.analytics || EMPTY_ANALYTICS;
  const deliveryRatePct = Number(analytics?.rates?.deliveryRatePct || 0);
  const readRatePct = Number(analytics?.rates?.readRatePct || 0);
  const sent = Number(analytics?.overview?.sent || 0);
  const delivered = Number(analytics?.overview?.delivered || 0);
  const read = Number(analytics?.overview?.read || 0);

  const monthly = analytics?.growth?.monthly || { thisMonth: 0, lastMonth: 0, pct: 0 };
  const contactsGrowth = analytics?.growth?.contacts || { thisWeek: 0, lastWeek: 0, pct: 0 };

  const monthlyUp = Number(monthly.pct || 0) >= 0;
  const contactsUp = Number(contactsGrowth.pct || 0) >= 0;

  return (
    <div className="space-y-6 md:space-y-8 p-3 md:p-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-xs md:text-base text-slate-500 font-medium">Welcome back!</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboard}
            disabled={loading || syncing}
            className="flex-1 sm:flex-none rounded-[5px] h-9 md:h-10 px-3 md:px-4"
          >
            <RefreshCw size={14} className={cn("mr-2 transition-transform duration-700", syncing && "animate-spin")} />
            <span className="xs:inline">{syncing ? "Syncing..." : "Sync"}</span>
          </Button>
          <Button size="sm" onClick={() => navigate("/app/send")} className="flex-1 sm:flex-none rounded-[5px] h-9 md:h-10 px-3 md:px-4">
            <Plus size={14} className="mr-1.5" />
            <span>New Campaign</span>
          </Button>
        </div>
      </div>


      {/* Onboarding Section */}
      <Card className={cn(
        "relative overflow-hidden border-brand-200 bg-gradient-to-br from-white to-brand-50/20 transition-all duration-300 rounded-[5px]",
        !stepsExpanded && "p-4 opacity-90"
      )}>
        <div className={cn("p-6", !stepsExpanded && "p-0")}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-100 rounded-[5px] text-brand-600">
                <Zap size={20} fill="currentColor" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Quick Setup Guide</h3>
                <p className="text-xs text-slate-500 font-medium">{steps.filter(s => s.done).length} / {steps.length} steps completed</p>
              </div>
            </div>
            <button
              onClick={() => setStepsExpanded(!stepsExpanded)}
              className="p-2 hover:bg-white rounded-[5px] transition-colors text-slate-400 hover:text-slate-900"
            >
              {stepsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          {stepsExpanded && (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {steps.map((step) => (
                <Link key={step.id} to={step.done ? "#" : step.href} className={cn(
                  "group relative flex flex-col p-4 rounded-[5px] border transition-all duration-200",
                  step.done
                    ? "bg-white/50 border-emerald-100 text-slate-500"
                    : "bg-white border-slate-200 hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/5"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    {step.done
                      ? <div className="p-1 bg-emerald-500 rounded-full text-white"><CheckCircle2 size={14} /></div>
                      : <div className="p-1 bg-slate-100 rounded-full text-slate-300"><Circle size={14} /></div>
                    }
                    <span className="text-[10px] font-black text-slate-300">STEP 0{step.id}</span>
                  </div>
                  <div className={cn("text-xs font-bold leading-tight", !step.done && "text-slate-900 group-hover:text-brand-600")}>
                    {step.label}
                  </div>
                  {!step.done && <ArrowRight size={14} className="mt-3 text-brand-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />}
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Stats Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Key Metrics Grid */}
          <div className="grid gap-3 grid-cols-2">
            {[
              {
                label: "Contacts",
                value: Number(analytics?.counts?.contacts || 0),
                icon: Users,
                trendDir: contactsUp ? "up" : "down",
                trendValue: `${Math.abs(Number(contactsGrowth.pct || 0)).toFixed(1)}%`,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Messages",
                value: sent,
                icon: MessageCircle,
                trendDir: monthlyUp ? "up" : "down",
                trendValue: `${Math.abs(Number(monthly.pct || 0)).toFixed(1)}%`,
                color: "text-[#ea580c]/60",
                bg: "bg-[#fff7ed]/50",
              },
              { label: "Sent", value: sent, icon: Send, trend: "Total", color: "text-[#0891b2]/60", bg: "bg-[#ecfeff]/50" },
              { label: "Delivered", value: delivered, icon: TrendingUp, trend: deliveryRatePct >= 50 ? "Good" : "Low", color: "text-[#7c3aed]/60", bg: "bg-[#f5f3ff]/50" },
              { label: "Read", value: read, icon: Eye, trend: readRatePct >= 20 ? "Good" : "Low", color: "text-green-600", bg: "bg-green-50" },
              { label: "Failed", value: Number(analytics?.overview?.failed || 0), icon: XCircle, trend: "Watch", color: "text-red-600", bg: "bg-red-50" },
              { label: "Total Campaigns", value: Number(analytics?.counts?.campaigns || 0), icon: Megaphone, trend: "Live", color: "text-brand-600", bg: "bg-brand-50" },
              { label: "Templates", value: Number(analytics?.counts?.templates || 0), icon: FileText, trend: "Library", color: "text-brand-600", bg: "bg-brand-50" },
              { label: "Engagement", value: sent > 0 ? `${Math.round((read / sent) * 100)}%` : "0%", icon: MessageSquare, trend: readRatePct >= 20 ? "High" : "Low", color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Today's Messages", value: Number(analytics?.today?.sent || 0), icon: Calendar, trend: "Today", color: "text-brand-600", bg: "bg-brand-50" },
            ].map((stat, i) => (
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
                    ) : (
                      <span>{stat.trend}</span>
                    )}
                  </div>
                </div>
                <div className={cn("p-2 md:p-3 rounded-[5px] transition-transform group-hover:scale-110 shrink-0 ml-2", stat.bg, stat.color)}>
                  <stat.icon size={18} className="md:size-6" />
                </div>
              </Card>
            ))}
          </div>

          {/* New Summary Cards (before graph, added without removing anything) */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-6 rounded-[5px]">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-[10px] bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Send size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-800">Delivery Rate</div>
                </div>
              </div>
              <div className="mt-6 text-4xl font-black tracking-tight text-slate-900">{deliveryRatePct.toFixed(1)}%</div>
              <div className="mt-4 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-emerald-600" style={{ width: `${Math.min(100, Math.max(0, deliveryRatePct))}%` }} />
              </div>
              <div className="mt-3 text-sm text-slate-500 font-medium">{delivered.toLocaleString()} of {sent.toLocaleString()} messages</div>
            </Card>

            <Card className="p-6 rounded-[5px]">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-[10px] bg-violet-50 text-violet-700 flex items-center justify-center">
                  <Eye size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-800">Read Rate</div>
                </div>
              </div>
              <div className="mt-6 text-4xl font-black tracking-tight text-slate-900">{readRatePct.toFixed(1)}%</div>
              <div className="mt-4 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-violet-600" style={{ width: `${Math.min(100, Math.max(0, readRatePct))}%` }} />
              </div>
              <div className="mt-3 text-sm text-slate-500 font-medium">{read.toLocaleString()} of {sent.toLocaleString()} messages</div>
            </Card>

            <Card className="p-6 rounded-[5px]">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-[10px] bg-amber-50 text-amber-700 flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-800">Monthly Growth</div>
                </div>
              </div>
              <div className="mt-6 flex items-end gap-3">
                <div className="text-4xl font-black tracking-tight text-slate-900">{Math.abs(Number(monthly.pct || 0)).toFixed(1)}%</div>
                <div className={cn("mb-1 inline-flex items-center gap-1 text-sm font-black", monthlyUp ? "text-emerald-600" : "text-red-600")}>
                  {monthlyUp ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-500 font-medium">
                {Number(monthly.thisMonth || 0).toLocaleString()} this month vs {Number(monthly.lastMonth || 0).toLocaleString()} last month
              </div>
            </Card>

            <Card className="p-6 rounded-[5px] lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-[10px] bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-black text-slate-900">Contact Growth</div>
                  <div className="text-xs font-bold text-slate-500">This week</div>
                </div>

              </div>
              <div className="mt-5 flex items-end justify-between">
                <div className="text-4xl font-black text-slate-900">{Number(contactsGrowth.thisWeek || 0).toLocaleString()}</div>
                <div className={cn("flex items-center gap-1 text-sm font-black", contactsUp ? "text-emerald-600" : "text-red-600")}>
                  {contactsUp ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  {Math.abs(Number(contactsGrowth.pct || 0)).toFixed(1)}%
                </div>
              </div>
            </Card>

            <Card className="p-6 rounded-[5px] lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-[10px] bg-fuchsia-50 text-fuchsia-700 flex items-center justify-center">
                  <LayoutDashboard size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-black text-slate-900">Campaign Overview</div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-full bg-fuchsia-50 flex items-center justify-center text-fuchsia-700">
                    <Megaphone size={22} />
                  </div>
                  <div>
                    <div className="text-4xl font-black text-slate-900">{Number(analytics?.counts?.campaigns || 0).toLocaleString()}</div>
                    <div className="text-sm font-medium text-slate-500">Campaigns</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-full bg-violet-50 flex items-center justify-center text-violet-700">
                    <FileText size={22} />
                  </div>
                  <div>
                    <div className="text-4xl font-black text-slate-900">{Number(analytics?.counts?.templates || 0).toLocaleString()}</div>
                    <div className="text-sm font-medium text-slate-500">Templates</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Sidebar/Profile Area */}
        <div className="space-y-8 lg:sticky lg:top-6 self-start">
          {/* Profile Card */}
          <Card className="relative overflow-hidden group rounded-[5px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {snapshot?.meta?.businessProfile?.profile_picture_url ? (
                  <div className="h-16 w-16 overflow-hidden rounded-[5px] ring-4 ring-slate-50 group-hover:scale-105 transition-transform">
                    <img
                      src={snapshot.meta.businessProfile.profile_picture_url}
                      alt="profile"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-[5px] bg-brand-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-brand-500/20">
                    {snapshot?.meta?.phone?.verified_name?.[0] || "W"}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-slate-900 truncate">
                    {snapshot?.meta?.phone?.verified_name || "WhatsApp Business"}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <img src="/verified-badge.png" alt="verified-badge" className="size-3" />
                    <span className="text-xs font-bold text-slate-500">{snapshot?.metaStatus === "active" ? "Verified" : "Offline"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-[5px] border border-slate-100">
                  <Phone size={16} className="text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                    <p className="text-xs font-bold text-slate-900 truncate">{snapshot?.meta?.phone?.display_phone_number || "Not Linked"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-[5px] border border-slate-100">
                  <Globe size={16} className="text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Category</p>
                    <p className="text-xs font-bold text-slate-900 truncate">{snapshot?.meta?.businessProfile?.vertical || "Other"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" onClick={() => setViewOpen(true)} className="rounded-[5px]">Profile</Button>
                <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)} className="rounded-[5px]">Edit</Button>
              </div>
            </div>
          </Card>

          {/* Wallet Card */}
          <Card className="p-6 bg-slate-900 text-white overflow-hidden relative group rounded-[5px]">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-brand-500/20 blur-3xl rounded-full -mb-8 -mr-8" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-brand-600 rounded-[5px] text-white">
                  <Wallet size={18} />
                </div>
                <Badge tone="brand" className="bg-brand-500/20 text-brand-50 border-none tracking-normal">WhatsApp Credits</Badge>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Balance</p>
              <h3 className="text-3xl font-black text-black mb-6">
                {formatCurrencySafe(Number(snapshot?.wallet?.balance ?? 0), String(snapshot?.wallet?.currency || "INR"))}
              </h3>
              <Button
                variant="primary"
                className="w-full bg-brand-500 hover:bg-brand-400 text-white font-black rounded-[5px]"
                onClick={() => setRechargeOpen(true)}
              >
                <Plus size={20} /> Buy Credits
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Volume Chart */}
      <Card className="p-3 md:p-8 border-ink-900/5 shadow-xl shadow-ink-900/5 relative overflow-hidden rounded-[5px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h3 className="text-lg md:text-xl font-black text-slate-900">Campaign Activity</h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">Real-time message delivery tracking</p>
          </div>
          <div className="flex bg-slate-100 rounded-[5px] p-1 self-start md:self-auto">
            {["Today", "Last 7 Days", "30 Days"].map((f) => (
              <button
                key={f}
                onClick={() => setChartFilter(f as any)}
                className={cn(
                  "px-4 py-1.5 text-[11px] font-bold rounded-[5px] transition-all",
                  chartFilter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 relative min-h-[180px] md:min-h-[250px] mt-4 md:mt-0">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            {[0, 1, 2, 3, 4].map(i => <div key={i} className="w-full border-t border-slate-300" />)}
          </div>

          <svg
            viewBox="0 0 800 250"
            preserveAspectRatio="none"
            className="w-full h-[180px] md:h-[250px] overflow-visible relative z-10"
          >
            {/* Sent Line Area */}
            <path
              d={`${getPath(graphData, "val", 250, 800)} L 800,250 L 0,250 Z`}
              className="fill-brand-500/5"
            />
            {/* Delivered Line Area */}
            <path
              d={`${getPath(graphData, "delivered", 250, 800)} L 800,250 L 0,250 Z`}
              className="fill-brand-500/10"
            />

            {/* Lines */}
            <motion.path
              key={`val-${chartFilter}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              d={getPath(graphData, "val", 250, 800)}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="text-slate-300 md:stroke-[2]"
            />
            <motion.path
              key={`del-${chartFilter}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
              d={getPath(graphData, "delivered", 250, 800)}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="text-brand-600 md:stroke-[3.5]"
            />
          </svg>

          {/* Interactive Points & Tooltips */}
          <div className="absolute inset-0 flex z-20">
            {graphData.map((d, i) => {
              const maxVal = Math.max(...graphData.map((x) => Math.max(Number(x?.val || 0), Number(x?.delivered || 0))), 1);
              const delY = 250 - (Number(d.delivered || 0) / maxVal) * (250 * 0.85);

              return (
                <div key={i} className="flex-1 group relative">
                  {/* Sentinel for hover */}
                  <div className="absolute inset-y-0 left-0 w-full hover:bg-brand-500/[0.02] transition-colors" />

                  {/* Data point markers */}
                  <div
                    className="absolute w-2.5 h-2.5 bg-white border-2 border-brand-600 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all z-30"
                    style={{ left: "50%", top: `${delY}px` }}
                  />

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-slate-900 text-white text-[10px] px-3 py-2 rounded-[5px] opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-40 shadow-2xl border border-slate-700 whitespace-nowrap translate-y-1 group-hover:translate-y-0">
                    <div className="font-black mb-1 border-b border-slate-700 pb-1">{d.label}</div>
                    <div className="space-y-1 mt-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Sent Volume:</span>
                        <span className="font-black">{d.val}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-brand-400">Delivered:</span>
                        <span className="font-black text-brand-400">{d.delivered}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-[9px] pt-1 border-t border-slate-800">
                        <span className="text-slate-500 uppercase tracking-tighter">Success Rate</span>
                        <span className="text-emerald-400 font-bold">
                          {Math.round((Number(d.delivered || 0) / Math.max(1, Number(d.val || 0))) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-6 px-1 md:px-2 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-20 overflow-x-auto">
          <div className="min-w-[720px] flex">
            {graphData.map((d, i) => (
              <span key={i} className={cn(
                "flex-1 text-center transition-opacity whitespace-nowrap px-1",
                // reduce label clutter
                chartFilter === "Today"
                  ? (i % 3 !== 0 ? "opacity-0 md:opacity-100" : "opacity-100")
                  : (chartFilter === "30 Days" || chartFilter === "Last 7 Days") && i % 2 !== 0
                    ? "opacity-0 md:opacity-100"
                    : "opacity-100"
              )}>
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </Card>
      {/* Activity List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Activity</h3>
          <Link to="/app/send" className="text-[10px] font-bold text-brand-600 hover:underline">View All</Link>
        </div>
        <div className="space-y-2">
          {liveActivities.length > 0 ? (
            liveActivities.map((act) => (
              <div key={act.id} className="flex gap-4 p-3 hover:bg-white rounded-[5px] border border-transparent hover:border-slate-100 transition-all group">
                <div className={cn("mt-1 size-2 rounded-full shrink-0 group-hover:animate-ping", act.color)} />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 leading-tight mb-1">{act.title}</p>
                  <p className="text-[10px] text-slate-400">{act.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-[5px] border border-dashed border-slate-200">
              <p className="text-xs text-slate-400">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <WhatsAppManagerProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        businessProfile={snapshot?.meta?.businessProfile || null}
        onSaved={() => loadDashboard()}
      />

      <WhatsAppManagerProfileViewModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        phone={snapshot?.meta?.phone || null}
        businessProfile={snapshot?.meta?.businessProfile || null}
      />

      <RechargeModal
        open={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        onPaid={() => setTimeout(() => loadDashboard(), 3500)}
      />
    </div>
  );
}
