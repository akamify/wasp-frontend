import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { useAuth } from "@shared/providers/AuthContext";
import { useToast } from "@shared/providers/ToastContext";
import { ConfirmModal, HistoryDetailModal, JsonCard, PaymentLinkDetailModal, PaymentLinkResultModal, PlanModal, UsageCard } from "./modals";
import { inr, toIst, useScrollList } from "./shared";
import type { TabKey } from "./shared";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";

export function SubscriptionWorkspaceDetail() {
  const { workspaceId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isSuperAdmin = String(user?.role || "") === "super_admin" && location.pathname.startsWith("/super-admin");
  const base = isSuperAdmin ? "/super-admin/subscriptions-data" : "/admin/subscriptions-data";
  const [tab, setTab] = useState<TabKey>("overview");
  const [overview, setOverview] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignConfirmOpen, setAssignConfirmOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [disablePlanConfirmOpen, setDisablePlanConfirmOpen] = useState(false);
  const [disablePlanLoading, setDisablePlanLoading] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkConfirmOpen, setLinkConfirmOpen] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkResultModalOpen, setLinkResultModalOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [durationMonths, setDurationMonths] = useState(1);
  const [reason, setReason] = useState("");
  const [selectedModalItem, setSelectedModalItem] = useState<any>(null);
  const [superAdminAction, setSuperAdminAction] = useState<null | "activate" | "block" | "delete">(null);
  const [superAdminActionLoading, setSuperAdminActionLoading] = useState(false);

  const history = useScrollList(useCallback((page: number) => API.admin.subscriptionWorkspaceHistory(workspaceId, { page, limit: 20 }).then((r: any) => ({ items: r?.data?.items || [], totalPages: Number(r?.data?.pagination?.totalPages || 1) })), [workspaceId]));
  const paymentLinks = useScrollList(useCallback((page: number) => API.admin.subscriptionWorkspacePaymentLinks(workspaceId, { page, limit: 20 }).then((r: any) => ({ items: r?.data?.items || [], totalPages: Number(r?.data?.pagination?.totalPages || 1) })), [workspaceId]));

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true); setOverviewError("");
    try { const [o, p] = await Promise.all([API.admin.subscriptionWorkspaceOverview(workspaceId), API.billing.plans()]); setOverview(o?.data?.item || null); setPlans(Array.isArray(p?.data?.plans) ? p.data.plans : []); }
    catch (e: any) { setOverviewError(e?.response?.data?.message || "Failed to load overview"); }
    finally { setLoadingOverview(false); }
  }, [workspaceId]);

  useEffect(() => { loadOverview(); history.reset(); paymentLinks.reset(); }, [loadOverview]);
  const currentPlan = useMemo(() => plans.find((p) => String(p.id) === String(selectedPlanId)) || null, [plans, selectedPlanId]);
  const pricing = useMemo(() => { const p = currentPlan?.pricing || {}; return { original: Number(p.originalPricePaise || 0), discounted: Number(p.discountedPricePaise || 0), discountAmount: Number(p.discountAmountPaise || 0), discountPercent: Number(p.discountPercent || 0), gstPercent: Number(p.gstPercent || 0), gstAmount: Number(p.gstAmountPaise || 0), payable: Number(p.payableAmountPaise || 0) }; }, [currentPlan]);

  async function submitAssign() { if (!selectedPlanId) return; setAssignLoading(true); try { await API.admin.assignWorkspacePlan(workspaceId, { planId: selectedPlanId, durationMonths, reason: reason || "Manual override", paymentMode: "manual" }); setAssignConfirmOpen(false); setAssignModalOpen(false); toast("Plan assigned successfully", "success"); await Promise.all([loadOverview(), history.reset()]); } catch (e: any) { toast(e?.response?.data?.message || "Failed to assign plan", "error"); } finally { setAssignLoading(false); } }
  async function disableActivePlan() { setDisablePlanLoading(true); try { await API.admin.disableActiveWorkspacePlan(workspaceId); toast("Active plan disabled", "success"); setDisablePlanConfirmOpen(false); await Promise.all([loadOverview(), history.reset()]); } catch (e: any) { toast(e?.response?.data?.message || "Failed to disable active plan", "error"); } finally { setDisablePlanLoading(false); } }
  async function submitCreatePaymentLink() { if (!selectedPlanId) return; setLinkLoading(true); try { const out = await API.admin.createWorkspacePaymentLink(workspaceId, { planId: selectedPlanId, durationMonths, expiresInHours: 72 }); setGeneratedLink(out?.data?.item || null); setLinkConfirmOpen(false); setLinkModalOpen(false); setLinkResultModalOpen(true); await paymentLinks.reset(); } catch (e: any) { toast(e?.response?.data?.message || "Failed to generate payment link", "error"); } finally { setLinkLoading(false); } }
  async function copyGeneratedLink() { const url = generatedLink?.purchaseUrl; if (!url) return; try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => { setCopied(false); setGeneratedLink(null); setLinkResultModalOpen(false); }, 700); } catch { toast("Copy failed", "error"); } }
  async function cancelPaymentLink(id: string) { try { await API.admin.cancelWorkspacePaymentLink(id); toast("Payment link disabled", "success"); await paymentLinks.reset(); if (selectedModalItem?.row?.id === id) setSelectedModalItem(null); } catch (e: any) { toast(e?.response?.data?.message || "Failed to disable link", "error"); } }
  async function runSuperAdminAction() {
    if (!superAdminAction) return;
    setSuperAdminActionLoading(true);
    try {
      if (superAdminAction === "activate") {
        await API.superAdmin.activateWorkspacePlan(workspaceId, { reason: "Activated from workspace detail" });
        toast("Workspace access restored", "success");
      } else if (superAdminAction === "block") {
        await API.superAdmin.blockWorkspacePlan(workspaceId, { reason: "Blocked from workspace detail" });
        toast("Workspace blocked", "success");
      } else {
        await API.superAdmin.deleteWorkspacePlanAssignment(workspaceId, { reason: "Plan assignment removed from workspace detail" });
        toast("Workspace plan assignment removed", "success");
      }
      setSuperAdminAction(null);
      await Promise.all([loadOverview(), history.reset()]);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to update workspace", "error");
    } finally {
      setSuperAdminActionLoading(false);
    }
  }

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { const node = scrollRef.current; if (!node) return; const onScroll = () => { if (node.scrollTop + node.clientHeight < node.scrollHeight - 160) return; if (tab === "history") history.loadMore(); if (tab === "payment-links") paymentLinks.loadMore(); }; node.addEventListener("scroll", onScroll, { passive: true }); return () => node.removeEventListener("scroll", onScroll); }, [tab, history, paymentLinks]);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8 pb-20">
      <div className="rounded-[5px] border border-slate-200 bg-white p-4 flex items-center justify-between"><div><div className="text-lg font-black text-slate-900">Workspace Subscription Overview</div><div className="text-xs text-slate-500 mt-1">{workspaceId}</div></div><div className="flex items-center gap-2 flex-wrap"><Button variant="ghost" onClick={() => navigate(base)}>Back</Button><Button variant="ghost" onClick={loadOverview}>Refresh</Button><Button variant="danger" onClick={() => setDisablePlanConfirmOpen(true)}>Disable Active Plan</Button><Button onClick={() => setAssignModalOpen(true)}>Assign Plan</Button>{isSuperAdmin ? <><Button variant="outline" onClick={() => setSuperAdminAction("activate")}>Activate</Button><Button variant="outline" onClick={() => setSuperAdminAction("block")}>Block Workspace</Button><Button variant="danger" onClick={() => setSuperAdminAction("delete")}>Delete Plan</Button></> : null}</div></div>
      {overviewError ? <Alert variant="danger">{overviewError}</Alert> : null}
      <div className="rounded-[5px] border border-slate-200 bg-white p-2 flex items-center gap-2 justify-between"><div className="flex items-center gap-2">{(["overview", "payment-links", "history"] as TabKey[]).map((k) => <button key={k} type="button" onClick={() => setTab(k)} className={`rounded-[5px] px-3 py-2 text-xs font-black uppercase tracking-wider ${tab === k ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{k}</button>)}</div>{tab === "payment-links" ? <Button onClick={() => setLinkModalOpen(true)}>Create Link</Button> : null}</div>
      <div ref={scrollRef} className="rounded-[5px] border border-slate-200 bg-white p-4 max-h-[70vh] overflow-y-auto">{loadingOverview && !overview ? <TableSkeleton cols={4} rows={8} /> : null}
        {tab === "overview" && overview ? <div className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-4 gap-3"><UsageCard title="Contacts" data={overview.usage?.contacts} /><UsageCard title="Templates" data={overview.usage?.templates} /><UsageCard title="Employees" data={overview.usage?.employees} /><UsageCard title="Campaigns" data={overview.usage?.campaigns} /></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><div className="rounded-[5px] border border-slate-200 p-4"><div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Workspace Status</div><div className="mt-2 flex items-center gap-2"><Badge className={overview.workspaceStatus === "suspended" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}>{overview.workspaceStatus || "active"}</Badge><span className="text-xs text-slate-500">Current plan: {overview.subscription?.planName || overview.plan || "free"}</span></div></div><div className="rounded-[5px] border border-slate-200 p-4"><div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">AI Eligibility</div><div className="mt-2 text-sm font-bold text-slate-900">{overview.aiDiagnostics?.aiFeatureEligible ? "Eligible" : "Blocked"}</div><div className="mt-1 text-xs text-slate-500">{overview.aiDiagnostics?.aiBlockedReason || "ready"}</div></div><div className="rounded-[5px] border border-slate-200 p-4"><div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Auto Renew</div><div className="mt-2 text-sm font-bold text-slate-900">{overview.subscription?.autoRenewEnabled ? "Enabled" : "Disabled"}</div><div className="mt-1 text-xs text-slate-500">{overview.subscription?.paymentMode || "-"}</div></div></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><JsonCard title="Features Enabled" data={overview.subscription?.features || {}} /><JsonCard title="Limits" data={overview.subscription?.limits || {}} /></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><JsonCard title="AI Diagnostics" data={overview.aiDiagnostics || {}} /><div className="rounded-[5px] border border-slate-200 p-4"><div className="text-xs font-black uppercase tracking-wider text-slate-500">Audit Timeline</div><div className="mt-3 space-y-3">{Array.isArray(overview.auditTimeline) && overview.auditTimeline.length ? overview.auditTimeline.map((entry: any) => <div key={entry.id} className="rounded-[5px] border border-slate-200 p-3"><div className="text-sm font-bold text-slate-900">{entry.action}</div><div className="mt-1 text-xs text-slate-500">{toIst(entry.createdAt)}</div><pre className="mt-2 whitespace-pre-wrap break-all text-[11px] text-slate-600">{JSON.stringify(entry.metadata || {}, null, 2)}</pre></div>) : <div className="text-sm text-slate-500">No audit events found.</div>}</div></div></div></div> : null}
        {tab === "history" ? <div className="space-y-3">{history.items.map((row) => <div key={row.id} className="rounded-[5px] border border-slate-200 p-3 cursor-pointer hover:bg-slate-50" onClick={() => setSelectedModalItem({ type: "history", row })}><div className="flex items-center justify-between"><div className="text-sm font-bold text-slate-900">{row.planName || row.planSlug || "-"}</div><Badge className="text-[10px]">{row.status || "-"}</Badge></div><div className="mt-2 text-xs text-slate-600">Payment Type: {row.paymentType || "-"}</div><div className="text-xs text-slate-600">Transaction: {row.transactionId || "-"}</div><div className="text-xs text-slate-600">Period: {toIst(row.currentPeriodStart)} - {toIst(row.currentPeriodEnd)}</div><div className="text-xs text-slate-600">Payable: {inr(row.payableAmountPaise)}</div></div>)}{history.loading ? <div className="text-xs text-slate-500">Loading...</div> : null}{history.error ? <Alert variant="danger">{history.error}</Alert> : null}</div> : null}
        {tab === "payment-links" ? <div className="space-y-3">{paymentLinks.items.map((row) => <div key={row.id} className="rounded-[5px] border border-slate-200 p-3 cursor-pointer hover:bg-slate-50" onClick={() => setSelectedModalItem({ type: "payment-link", row })}><div className="flex items-center justify-between"><div className="text-sm font-bold text-slate-900">{row.planName || row.planSlug || row.id}</div><Badge className="text-[10px]">{row.status}</Badge></div><div className="mt-2 text-xs text-slate-600">Duration: {row.durationMonths} month(s)</div><div className="text-xs text-slate-600">Expires: {row.expiresAt ? new Date(row.expiresAt).toLocaleString() : "-"}</div><div className="text-xs text-slate-600">Payable: {inr(row.amountSummary?.payableAmountPaise)}</div></div>)}{paymentLinks.loading ? <div className="text-xs text-slate-500">Loading...</div> : null}{paymentLinks.error ? <Alert variant="danger">{paymentLinks.error}</Alert> : null}</div> : null}
      </div>
      {assignModalOpen ? <PlanModal title="Assign Plan" plans={plans} selectedPlanId={selectedPlanId} setSelectedPlanId={setSelectedPlanId} durationMonths={durationMonths} setDurationMonths={setDurationMonths} reason={reason} setReason={setReason} pricing={pricing} currentPlan={currentPlan} onClose={() => setAssignModalOpen(false)} onProceed={() => setAssignConfirmOpen(true)} proceedLabel="Assign Now" /> : null}
      {linkModalOpen ? <PlanModal title="Create Payment Link" plans={plans} selectedPlanId={selectedPlanId} setSelectedPlanId={setSelectedPlanId} durationMonths={durationMonths} setDurationMonths={setDurationMonths} reason="" setReason={() => {}} hideReason pricing={pricing} currentPlan={currentPlan} onClose={() => setLinkModalOpen(false)} onProceed={() => setLinkConfirmOpen(true)} proceedLabel="Generate Payment Link" /> : null}
      {assignConfirmOpen ? <ConfirmModal title="Confirm Plan Override" text="Existing active plan will be overridden for this workspace. Continue?" onNo={() => setAssignConfirmOpen(false)} onYes={submitAssign} loading={assignLoading} yesLabel="Yes, Assign" /> : null}
      {disablePlanConfirmOpen ? <ConfirmModal title="Disable Active Plan" text="Are you sure? Active plan will be disabled for this workspace." onNo={() => setDisablePlanConfirmOpen(false)} onYes={disableActivePlan} loading={disablePlanLoading} yesLabel="Yes, Disable" /> : null}
      {linkConfirmOpen ? <ConfirmModal title="Generate Payment Link" text="Proceed to generate single-use payment link for selected plan and duration?" onNo={() => setLinkConfirmOpen(false)} onYes={submitCreatePaymentLink} loading={linkLoading} yesLabel="Yes, Generate" /> : null}
      {linkResultModalOpen && generatedLink ? <PaymentLinkResultModal generatedLink={generatedLink} copied={copied} onClose={() => { setGeneratedLink(null); setLinkResultModalOpen(false); }} onCopy={copyGeneratedLink} /> : null}
      {selectedModalItem?.type === "payment-link" ? <PaymentLinkDetailModal row={selectedModalItem.row} onClose={() => setSelectedModalItem(null)} onDisable={() => cancelPaymentLink(selectedModalItem.row.id)} /> : null}
      {selectedModalItem?.type === "history" ? <HistoryDetailModal row={selectedModalItem.row} onClose={() => setSelectedModalItem(null)} /> : null}
      {superAdminAction ? <ConfirmModal title={superAdminAction === "activate" ? "Activate Workspace Plan" : superAdminAction === "block" ? "Block Workspace" : "Delete Workspace Plan"} text={superAdminAction === "activate" ? "Latest eligible plan will be restored and workspace access will be enabled." : superAdminAction === "block" ? "Workspace access will be suspended at platform level. Existing billing history stays preserved." : "Current plan assignment will be removed and workspace will be reset to free."} onNo={() => setSuperAdminAction(null)} onYes={runSuperAdminAction} loading={superAdminActionLoading} yesLabel={superAdminAction === "activate" ? "Yes, Activate" : superAdminAction === "block" ? "Yes, Block" : "Yes, Delete"} /> : null}
    </div>
  );
}
