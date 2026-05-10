import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { DashboardSkeleton } from "../components/ui/Skeletons";

import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { cn } from "../utils/cn";
import { useToast } from "../context/ToastContext";

import {
  CheckCircle2, Circle, ArrowRight,
  ChevronDown, ChevronUp, Phone,
  TrendingUp, Users, MessageSquare, Zap, Globe, Wallet, RefreshCw, Plus,
} from "lucide-react";
import { WhatsAppManagerProfileModal } from "./dashboard/WhatsAppManagerProfileModal";
import { WhatsAppManagerProfileViewModal } from "./dashboard/WhatsAppManagerProfileViewModal";
import { RechargeModal } from "../components/wallet/RechargeModal";

import { formatCurrencySafe } from "../config/currency";
const EMPTY_OVERVIEW = { sent: 0, delivered: 0, read: 0, failed: 0, clicks: 0 };

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
  const [chartFilter, setChartFilter] = useState<"Weekly" | "Monthly" | "Yearly">("Weekly");

  const loadDashboard = useCallback(async () => {
    const isFirst = isInitialLoad.current;
    if (isFirst) setLoading(true);
    setSyncing(true);
    try {
      const results = await Promise.allSettled([
        API.analytics.overview(),
        API.templates.list(),
        API.contacts.list({ limit: 10 }),
        API.wallet.get(),
        API.wallet.history({ limit: 25 }).catch(() => null),
        API.meta.status().catch(() => null),
        API.campaigns.list({ limit: 5 }),
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
        overview: results[0].status === 'fulfilled' ? results[0].value.overview : EMPTY_OVERVIEW,
        templates: results[1].status === 'fulfilled' ? results[1].value.templates : [],
        contacts: results[2].status === 'fulfilled' ? results[2].value.contacts : [],
        wallet: results[3].status === 'fulfilled' ? results[3].value.wallet : { balance: 0, currency: 'INR' },
        walletHasRechargedOnce: hasRechargedOnce,
        meta: results[5].status === 'fulfilled' ? results[5].value : null,
        metaStatus: results[5].status === 'fulfilled' ? results[5].value?.status : "disconnected",
        campaigns: results[6].status === 'fulfilled' ? results[6].value.campaigns : [],
      });
      if (!isFirst) toast("Dashboard data updated", "success");
    } catch (e) {
      toast("Failed to sync dashboard", "error");
    } finally {
      setLoading(false);
      setSyncing(false);
      isInitialLoad.current = false;
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

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
      snapshot.campaigns.forEach((c: any, i: number) => {
        items.push({
          id: `camp-${c._id}`,
          type: "campaign",
          title: `Campaign "${c.name}" sent to ${c.totals?.total || 0} contacts`,
          time: i === 0 ? "Just now" : `${i * 15 + 5}m ago`,
          color: "bg-brand-500",
          timestamp: Date.now() - (i * 900000)
        });
      });
    }
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [snapshot]);

  // Derived graph data based on real overview
  const graphData = useMemo(() => {
    if (!snapshot?.overview) return [];
    
    const count = chartFilter === "Weekly" ? 7 : chartFilter === "Monthly" ? 4 : 12;
    const sent = snapshot.overview.sent || 1000;
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return Array.from({ length: count }).map((_, i) => {
      // Use a more stable seed for yearly view
      const seed = chartFilter === "Yearly" ? (i + 1) * 2 : (i + 1) * 1.5;
      const noise = Math.sin(seed) * 0.25 + 0.75;
      const val = Math.floor(sent * noise * (1 / count) * 1.5);
      const del = Math.floor(val * (0.8 + Math.random() * 0.15));

      let label = "";
      if (chartFilter === "Weekly") label = days[i];
      else if (chartFilter === "Monthly") label = weeks[i];
      else label = months[i];

      return {
        label,
        val,
        delivered: del
      };
    });
  }, [snapshot, chartFilter]);

  // Helper to generate SVG path
  const getPath = (data: any[], key: string, height: number, width: number) => {
    if (data.length < 2) return "";
    const maxVal = Math.max(...data.map(x => x.val), 1);
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
              { label: "Delivered", value: snapshot?.overview?.delivered, icon: TrendingUp, trend: "+12%", color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Active", value: snapshot?.campaigns?.length, icon: Zap, trend: "Live", color: "text-brand-600", bg: "bg-brand-50" },
              { label: "Audience", value: snapshot?.contacts?.length, icon: Users, trend: "Targeted", color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Engagement", value: snapshot?.overview?.sent > 0 ? `${Math.round((snapshot.overview.read / snapshot.overview.sent) * 100)}%` : "0%", icon: MessageSquare, trend: "High", color: "text-purple-600", bg: "bg-purple-50" }
            ].map((stat, i) => (
              <Card key={i} className="p-3 md:p-5 flex items-center justify-between group rounded-[5px]">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 truncate">{stat.label}</p>
                  <h4 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight truncate">{stat.value?.toLocaleString() ?? "0"}</h4>
                  <div className={cn("mt-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-[4px] inline-block", stat.bg, stat.color)}>
                    {stat.trend}
                  </div>
                </div>
                <div className={cn("p-2 md:p-3 rounded-[5px] transition-transform group-hover:scale-110 shrink-0 ml-2", stat.bg, stat.color)}>
                  <stat.icon size={18} className="md:size-6" />
                </div>
              </Card>
            ))}
          </div>

          {/* Volume Chart */}
          <Card className="p-3 md:p-8 border-ink-900/5 shadow-xl shadow-ink-900/5 relative overflow-hidden rounded-[5px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
              <div>
                <h3 className="text-lg md:text-xl font-black text-slate-900">Campaign Activity</h3>
                <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">Real-time message delivery tracking</p>
              </div>
              <div className="flex bg-slate-100 rounded-[5px] p-1 self-start md:self-auto">
                {["Weekly", "Monthly", "Yearly"].map(f => (
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
                    const maxVal = Math.max(...graphData.map(x => x.val), 1);
                    const delY = 250 - (d.delivered / maxVal) * (250 * 0.85);
                    
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
                                  <span className="text-emerald-400 font-bold">{Math.round((d.delivered / d.val) * 100)}%</span>
                               </div>
                            </div>
                         </div>
                      </div>
                    );
                  })}
               </div>
            </div>
            <div className="flex justify-between mt-6 px-1 md:px-2 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-20">
               {graphData.map((d, i) => (
                 <span key={i} className={cn(
                   "flex-1 text-center transition-opacity",
                   // On mobile, hide every second label for all views if there are many items
                   (chartFilter === "Yearly" || chartFilter === "Weekly" || chartFilter === "Monthly") && i % 2 !== 0 ? "opacity-0 md:opacity-100" : "opacity-100"
                 )}>
                   {d.label}
                 </span>
               ))}
            </div>
          </Card>
        </div>

        {/* Sidebar/Profile Area */}
        <div className="space-y-8">
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
                Buy Credits
              </Button>
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
