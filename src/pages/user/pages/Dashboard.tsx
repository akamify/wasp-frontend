import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@api/api";
import { DashboardSkeleton } from "@components/ui/Skeletons";
import { RechargeModal } from "@components/wallet/RechargeModal";
import { useToast } from "@shared/providers/ToastContext";
import { WhatsAppManagerProfileModal } from "@pages/user/dashboard/WhatsAppManagerProfileModal";
import { WhatsAppManagerProfileViewModal } from "@pages/user/dashboard/WhatsAppManagerProfileViewModal";
import { DashboardHeader } from "@pages/user/pages/dashboard/DashboardHeader";
import { DashboardOnboarding } from "@pages/user/pages/dashboard/DashboardOnboarding";
import { DashboardMetricsGrid } from "@pages/user/pages/dashboard/DashboardMetricsGrid";
import { DashboardSummaryCards } from "@pages/user/pages/dashboard/DashboardSummaryCards";
import { DashboardSidebar } from "@pages/user/pages/dashboard/DashboardSidebar";
import { DashboardChart } from "@pages/user/pages/dashboard/DashboardChart";
import { DashboardActivity } from "@pages/user/pages/dashboard/DashboardActivity";

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
  const { toast } = useToast();
  const isInitialLoad = useRef(true);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [stepsExpanded, setStepsExpanded] = useState(true);
  const [chartFilter, setChartFilter] = useState<"Today" | "Last 7 Days" | "30 Days">("Last 7 Days");

  const analyticsRange = useMemo(() => (chartFilter === "Today" ? "today" : chartFilter === "30 Days" ? "30d" : "7d"), [chartFilter]);

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
      const hasRechargedOnce = transactions.some((t: any) => String(t?.type || "").toLowerCase() === "credit" && (String(t?.provider || "").toLowerCase() === "razorpay" || String(t?.reason || "").toLowerCase().includes("recharge")));

      setSnapshot({
        analytics: results[0].status === "fulfilled" ? results[0].value : EMPTY_ANALYTICS,
        overview: results[0].status === "fulfilled" ? results[0].value.overview : EMPTY_OVERVIEW,
        templates: results[1].status === "fulfilled" ? results[1].value.templates : [],
        contacts: results[2].status === "fulfilled" ? results[2].value.contacts : [],
        wallet: results[3].status === "fulfilled" ? results[3].value.wallet : { balance: 0, currency: "INR" },
        walletHasRechargedOnce: hasRechargedOnce,
        meta: results[5].status === "fulfilled" ? results[5].value : null,
        metaStatus: results[5].status === "fulfilled" ? results[5].value?.status : "disconnected",
        campaigns: results[6].status === "fulfilled" ? results[6].value.campaigns : [],
        billingCurrent: results[7].status === "fulfilled" ? results[7].value : null,
      });
      if (!isFirst) toast("Dashboard data updated", "success");
    } catch {
      toast("Failed to sync dashboard", "error");
    } finally {
      setLoading(false);
      setSyncing(false);
      isInitialLoad.current = false;
    }
  }, [toast]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  useEffect(() => {
    let active = true;
    if (!snapshot) return;
    setSyncing(true);
    API.analytics.overview({ range: analyticsRange }).then((r: any) => {
      if (!active) return;
      setSnapshot((prev: any) => (prev ? { ...prev, analytics: r, overview: r?.overview || prev.overview } : prev));
    }).catch(() => {}).finally(() => { if (active) setSyncing(false); });
    return () => { active = false; };
  }, [analyticsRange]);

  const steps = useMemo(() => ([
    { id: 1, label: "Connect Meta Account", done: snapshot?.metaStatus === "active", href: "/app/meta" },
    { id: 2, label: "Create Template", done: snapshot?.templates?.some((t: any) => t.status === "approved"), href: "/app/templates" },
    { id: 3, label: "Add Your Contacts", done: snapshot?.contacts?.length > 0, href: "/app/contacts" },
    { id: 4, label: "Add Wallet Balance", done: (snapshot?.wallet?.balance > 0) || !!snapshot?.walletHasRechargedOnce, href: "/app/wallet" },
    { id: 5, label: "Create Campaign", done: snapshot?.campaigns?.length > 0, href: "/app/send" },
  ]), [snapshot]);

  const allStepsDone = useMemo(() => steps.length > 0 && steps.every((s) => s.done), [steps]);
  useEffect(() => { if (snapshot && allStepsDone) setStepsExpanded(false); }, [snapshot, allStepsDone]);

  const liveActivities = useMemo(() => {
    if (!snapshot?.campaigns) return [];
    return snapshot.campaigns.map((c: any) => {
      const date = c.createdAt ? new Date(c.createdAt) : new Date();
      return { id: `camp-${c._id || Math.random()}`, title: `Campaign "${c.name}" sent to ${c.totals?.total || 0} contacts`, time: date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }), color: "bg-brand-500", timestamp: date.getTime() };
    }).sort((a: any, b: any) => b.timestamp - a.timestamp).slice(0, 5);
  }, [snapshot]);

  const graphData = useMemo(() => {
    const points = snapshot?.analytics?.series?.points;
    if (!Array.isArray(points) || !points.length) return [];
    return points.map((p: any) => ({ label: String(p.label || ""), val: Number(p.sent || 0), delivered: Number(p.delivered || 0) }));
  }, [snapshot]);

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
      <DashboardHeader syncing={syncing} loading={loading} onSync={loadDashboard} onNewCampaign={() => navigate("/app/send")} />
      <DashboardOnboarding steps={steps} stepsExpanded={stepsExpanded} onToggle={() => setStepsExpanded((v) => !v)} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <DashboardMetricsGrid analytics={analytics} sent={sent} delivered={delivered} read={read} contactsUp={contactsUp} contactsGrowth={contactsGrowth} monthlyUp={monthlyUp} monthly={monthly} />
          <DashboardSummaryCards analytics={analytics} deliveryRatePct={deliveryRatePct} readRatePct={readRatePct} sent={sent} delivered={delivered} read={read} monthly={monthly} monthlyUp={monthlyUp} contactsGrowth={contactsGrowth} contactsUp={contactsUp} />
        </div>
        <DashboardSidebar snapshot={snapshot} onView={() => setViewOpen(true)} onEdit={() => setEditOpen(true)} onRecharge={() => setRechargeOpen(true)} />
      </div>

      <DashboardChart chartFilter={chartFilter} setChartFilter={setChartFilter} graphData={graphData} />
      <DashboardActivity liveActivities={liveActivities} />

      <WhatsAppManagerProfileModal open={editOpen} onClose={() => setEditOpen(false)} businessProfile={snapshot?.meta?.businessProfile || null} onSaved={() => loadDashboard()} />
      <WhatsAppManagerProfileViewModal open={viewOpen} onClose={() => setViewOpen(false)} phone={snapshot?.meta?.phone || null} businessProfile={snapshot?.meta?.businessProfile || null} />
      <RechargeModal open={rechargeOpen} onClose={() => setRechargeOpen(false)} onPaid={() => setTimeout(() => loadDashboard(), 3500)} />
    </div>
  );
}
