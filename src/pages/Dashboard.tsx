import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  CheckCircle2, Circle, ArrowRight,
  Phone, Edit2, ChevronDown, ChevronUp
} from "lucide-react";
import { WhatsAppManagerProfileModal } from "./dashboard/WhatsAppManagerProfileModal";
import { WhatsAppManagerProfileViewModal } from "./dashboard/WhatsAppManagerProfileViewModal";
import { RechargeModal } from "../components/wallet/RechargeModal";

const EMPTY_OVERVIEW = { sent: 0, delivered: 0, read: 0, failed: 0, clicks: 0 };
const formatCurrency = (v: number, c = "INR") => {
  const n = Number.isFinite(v) ? v : 0;
  // Avoid floating point artifacts like 0.40000000000000036 in display.
  const rounded = Math.round((n + Number.EPSILON) * 100) / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: c,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
};

export default function DashboardPage() {
  const { workspace } = useAuth();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<any>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    setBusy(true);
    try {
      // In a real app, Promise.allSettled is better (as in your original code)
      // Keeping it simple for the UI demo
      const results = await Promise.allSettled([
        API.analytics.overview(),
        API.templates.list(),
        API.contacts.list({ limit: 10 }),
        API.wallet.get(),
        // Used to mark wallet step complete even if user spent credits back to 0.
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
    } catch (e) {
      setError("Failed to sync dashboard");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const steps = useMemo(() => [
    { id: 1, label: "Add WABA + Phone IDs", done: snapshot?.metaStatus === "active", href: "/app/meta" },
    { id: 2, label: "Create WhatsApp Template", done: snapshot?.templates?.some((t: any) => t.status === 'approved'), href: "/app/templates" },
    { id: 3, label: "Import Your Contacts", done: snapshot?.contacts?.length > 0, href: "/app/contacts" },
    { id: 4, label: "Add Wallet Balance", done: (snapshot?.wallet?.balance > 0) || !!snapshot?.walletHasRechargedOnce, href: "/app/wallet" },
    { id: 5, label: "Launch First Campaign", done: snapshot?.campaigns?.length > 0, href: "/app/send" },
  ], [snapshot]);
  const allStepsDone = useMemo(() => steps.length > 0 && steps.every((s) => s.done), [steps]);
  const prevAllStepsDoneRef = useRef(false);
  const [stepsExpanded, setStepsExpanded] = useState(true);

  useEffect(() => {
    if (!allStepsDone) {
      setStepsExpanded(true);
      prevAllStepsDoneRef.current = false;
      return;
    }

    if (!prevAllStepsDoneRef.current) {
      setStepsExpanded(false);
      prevAllStepsDoneRef.current = true;
    }
  }, [allStepsDone]);

  if (busy && !snapshot) return <div className="flex h-[60vh] items-center justify-center"><Spinner label="Loading dashboard..." /></div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Full-width dashboard navbar */}
      <div className="rounded-[5px] border border-ink-900/10 bg-white/80 px-5 py-4 backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-600">
              {workspace?.name || "Workspace"}
            </div>
            <div className="mt-1 truncate text-lg font-black tracking-tight text-ink-900">
              {snapshot?.meta?.phone?.verified_name || "WhatsApp Business Manager"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={loadDashboard} disabled={busy}>
              {busy ? "Refreshing..." : "Refresh"}
            </Button>
            {snapshot?.metaStatus !== "active" ? (
              <Button onClick={() => navigate("/app/meta")}>WhatsApp Setup</Button>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap grid grid-cols-2 md:grid-cols-2 gap-5 pt-5">
          <div>
            WhatsApp Business API Status:{" "}
            <Badge tone={snapshot?.metaStatus === "active" ? "good" : snapshot?.metaStatus === "pending" ? "warn" : "bad"}>
              {snapshot?.metaStatus === "active" ? "LIVE" : snapshot?.metaStatus === "pending" ? "PENDING" : "OFF"}
            </Badge>
          </div>
          <div>
            Plan:{" "}
            <Badge tone="neutral">{String(workspace?.plan || "FREE").toUpperCase()}</Badge>
          </div>
          <div>
            Tier:{" "}
            <Badge tone={snapshot?.meta?.limits?.messagingLimitTier ? "warn" : "neutral"}>
              {snapshot?.meta?.limits?.messagingLimitTier || "N/A"}
            </Badge>
          </div>
          <div>
            Throughput Level:{" "}
            <Badge tone={snapshot?.meta?.phone?.throughput?.level ? "neutral" : "neutral"}>
              {snapshot?.meta?.phone?.throughput?.level || "N/A"}
            </Badge>
          </div>
        </div>
        {snapshot?.meta?.debugHint ? (
          <div className="pt-3">
            <Alert tone="warn">
              Meta fetch warning: {snapshot.meta.debugHint}. Try `WhatsApp Setup` and re-save credentials.
            </Alert>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

        {error ? <Alert>{error}</Alert> : null}

        {/* LEFT CONTENT AREA */}
        <div className="flex-1 space-y-8">

          {/* Welcome & Stepper Card (AiSensy Style) */}
          <section className="relative overflow-hidden rounded-[5px] border border-brand-200/50 bg-gradient-to-br from-white to-brand-50/30 p-8 shadow-sm">
            <div className="relative z-10">

              <div className="">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-ink-900/40">Setup Progress</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-brand-600">{steps.filter(s => s.done).length} / {steps.length} Completed</span>
                    {allStepsDone ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStepsExpanded((v) => !v)}
                        className="h-7 px-2"
                        title={stepsExpanded ? "Collapse" : "Expand"}
                      >
                        {stepsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div
                  className={cn(
                    "overflow-hidden transition-[max-height,opacity] duration-300 ease-out",
                    stepsExpanded ? "max-h-[720px] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {steps.map((step) => (
                      <Link key={step.id} to={step.href} className={cn(
                        "group relative flex flex-col p-5 rounded-[5px] border transition-all",
                        step.done ? "bg-white border-brand-200" : "bg-white/50 border-ink-900/5 hover:border-brand-300"
                      )}>
                        <div className="flex items-center justify-between mb-3">
                          {step.done ? <CheckCircle2 className="text-brand-600" size={22} /> : <Circle className="text-ink-900/10" size={22} />}
                          <span className="text-[10px] font-bold text-ink-900/20">0{step.id}</span>
                        </div>
                        <div className="text-sm font-bold text-ink-900 group-hover:text-brand-600 transition-colors">{step.label}</div>
                        <ArrowRight size={16} className="mt-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-600" />
                      </Link>
                    ))}
                  </div>
                </div>

                {allStepsDone && !stepsExpanded ? (
                  <div className="mt-3 text-xs font-medium text-ink-900/40">
                    All setup steps completed. Expand to review.
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {/* Quick Metrics */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[
              { label: 'Total Sent', val: snapshot?.overview?.sent, color: 'text-blue-600' },
              { label: 'Delivered', val: snapshot?.overview?.delivered, color: 'text-emerald-600' },
              { label: 'Read Rate', val: `${Math.round((snapshot?.overview?.read / snapshot?.overview?.sent) * 100 || 0)}%`, color: 'text-purple-600' },
              { label: 'Wallet', val: formatCurrency(snapshot?.wallet?.balance), color: 'text-amber-600' },
            ].map((m) => (
              <Card key={m.label} className="p-5 border-none bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-800/40">{m.label}</div>
                <div className={cn("mt-2 text-2xl font-black", m.color)}>{m.val}</div>
              </Card>
            ))}
          </div>

          {/* Main Dashboard Modules (Inbox & Campaigns) */}
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Recent Conversations */}
            <Card className="p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-ink-900">Recent Chats</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/app/conversations')}>View All</Button>
              </div>
              <div className="space-y-3">
                {snapshot?.conversations?.slice(0, 5).map((chat: any) => (
                  <div key={chat.phone} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition cursor-pointer border border-transparent hover:border-ink-900/5">
                    <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                      {chat.contact?.name?.[0] || chat.phone?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-ink-900 truncate">{chat.contact?.name || chat.phone}</div>
                      <div className="text-xs text-ink-800/50 truncate">{chat.lastMessagePreview}</div>
                    </div>
                    <div className="text-[10px] text-ink-900/30 font-medium">2m ago</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Campaign Health */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-ink-900">Campaign Health</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/app/send')}>Analytics</Button>
              </div>
              {/* Simple Progress Bar UI */}
              <div className="space-y-6">
                {snapshot?.campaigns?.slice(0, 3).map((camp: any) => (
                  <div key={camp._id} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{camp.name}</span>
                      <span className="text-brand-600">{Math.round((camp.totals?.sent / camp.totals?.total) * 100 || 0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(camp.totals?.sent / camp.totals?.total) * 100 || 0}%` }}
                        className="h-full bg-brand-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* RIGHT STICKY SIDEBAR (Profile & Workspace) */}
        <aside className="w-full lg:w-[340px] space-y-6 lg:sticky lg:top-5 self-start">

          {/* Profile Card */}
          <Card className="p-6 border-none bg-ink-900 text-black overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex items-center justify-around gap-4 mb-6">
                {snapshot?.meta?.businessProfile?.profile_picture_url ? (
                  <div className="h-14 w-14 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
                    <img
                      src={snapshot.meta.businessProfile.profile_picture_url}
                      alt="logo"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-400 to-brand-600 p-0.5">
                    <div className="h-full w-full rounded-2xl bg-ink-900 flex items-center justify-center font-black text-xl text-white">
                      {snapshot?.meta?.phone?.verified_name?.[0] || snapshot?.meta?.phone?.display_phone_number?.[0] || "W"}
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">
                    {snapshot?.meta?.phone?.verified_name || "WhatsApp Manager Profile"}
                  </h2>
                  <p className="text-sm text-black/50">
                    {snapshot?.meta?.phone?.display_phone_number
                      ? `Phone: ${snapshot.meta.phone.display_phone_number}`
                      : snapshot?.metaStatus === "active"
                        ? "Phone: —"
                        : "Connect WhatsApp to see your manager profile."}
                  </p>
                </div>
              </div>



              <div className="mt-8 grid gap-3">
                <div className="flex items-center gap-3 text-sm text-black/70">
                  <Phone size={14} />{" "}
                  <span>{snapshot?.meta?.phone?.quality_rating || "N/A"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-black/70">
                  <ArrowRight size={14} />
                  <span>{snapshot?.meta?.businessProfile?.vertical || "OTHER"}</span>
                </div>
                {snapshot?.meta?.businessProfile?.about ? (
                  <div className="rounded-[5px] bg-white/5 px-3 py-2 text-sm text-black/70 ring-1 ring-white/10">
                    <span className="font-bold text-black/80">About:</span>{" "}
                    <span className="line-clamp-2">{snapshot.meta.businessProfile.about}</span>
                  </div>
                ) : snapshot?.meta?.businessProfile?.description ? (
                  <div className="rounded-[5px] bg-white/5 px-3 py-2 text-sm text-black/70 ring-1 ring-white/10">
                    <span className="font-bold text-black/80">Description:</span>{" "}
                    <span className="line-clamp-2">{snapshot.meta.businessProfile.description}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2 mt-8">
                <Button
                  variant="ghost"
                  className="w-full bg-white/5 border-black/10 hover:border-black/20 hover:bg-white/10 text-black"
                  onClick={() => setViewOpen(true)}
                >
                  <ArrowRight size={16} />
                  View profile
                </Button>
                <Button
                  variant="ghost"
                  className="w-full bg-white/5 border-black/10 hover:border-black/20 hover:bg-white/10 text-black"
                  onClick={() => setEditOpen(true)}
                >
                  <Edit2 size={16} />
                  Edit profile
                </Button>
              </div>
            </div>
          </Card>

          {/* Buy Credits (only after WABA setup) */}
          {snapshot?.metaStatus === "active" ? (
            <Card className="p-6 bg-white border-ink-900/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-900/40">Wallet</div>
                  <div className="mt-1 text-lg font-black tracking-tight text-ink-900">
                    {formatCurrency(
                      Number(snapshot?.wallet?.balance ?? 0),
                      String(snapshot?.wallet?.currency || "INR")
                    )}
                  </div>
                  <div className="mt-1 text-sm text-ink-800/70">Buy credits to send messages.</div>
                </div>
                <Button onClick={() => setRechargeOpen(true)}>Buy credits</Button>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-ink-900/50">
                <button className="cursor-pointer text-center text-brand-600 hover:underline" onClick={() => navigate("/app/wallet")}>
                  View full history
                </button>
              </div>
            </Card>
          ) : null}

        </aside>

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
    </div>
  );
}

// Helper function for tailwind class merging (ensure you have this utility)
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
