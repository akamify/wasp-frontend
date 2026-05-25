import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Check, Copy } from "lucide-react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { AdminLimitSelect } from "@pages/admin/components/AdminLimitSelect";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { SuperAdminPlanPreviewCard } from "@pages/admin/components/SuperAdminPlanPreviewCard";
import { useAdminList } from "@pages/admin/hooks/useAdminList";
import { useToast } from "@shared/providers/ToastContext";

type Item = any;
type TabKey = "overview" | "payment-links" | "history";

function inr(paise?: number | null) {
  if (paise == null) return "-";
  return `₹${Math.round(Number(paise) / 100).toLocaleString("en-IN")}`;
}

function toIst(value?: string | null) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true });
}

function useScrollList(fetcher: (page: number) => Promise<any>) {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = useCallback(async () => {
    setItems([]);
    setPage(1);
    setTotalPages(1);
    setError("");
    setLoading(true);
    try {
      const out = await fetcher(1);
      setItems(Array.isArray(out.items) ? out.items : []);
      setTotalPages(Number(out.totalPages || 1));
      setPage(1);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  const loadMore = useCallback(async () => {
    if (loading || page >= totalPages) return;
    setLoading(true);
    try {
      const next = page + 1;
      const out = await fetcher(next);
      setItems((prev) => [...prev, ...(Array.isArray(out.items) ? out.items : [])]);
      setTotalPages(Number(out.totalPages || totalPages));
      setPage(next);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load more");
    } finally {
      setLoading(false);
    }
  }, [fetcher, loading, page, totalPages]);

  return { items, loading, error, reset, loadMore, page, totalPages };
}

function SubscriptionsList() {
  const [summary, setSummary] = useState<{ plan: string; count: number }[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const base = isSuperAdmin ? "/super-admin/subscriptions-data" : "/admin/subscriptions-data";

  const fetcher = useCallback(
    (params: { page: number; limit: number; q: string }) =>
      API.admin.subscriptionsData(params).then((r: any) => {
        const data = r?.data || {};
        const pagination = data?.pagination || {};
        setSummary(Array.isArray(data?.summary) ? data.summary : []);
        return {
          items: data?.items || [],
          total: Number(pagination.total || 0),
          page: Number(pagination.page || params.page),
          limit: Number(pagination.limit || params.limit),
          totalPages: Number(pagination.totalPages || 1),
        };
      }),
    []
  );

  const list = useAdminList<Item>({ fetcher, initialLimit: 25 });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar
        title="Subscription Data"
        subtitle="Workspace subscriptions with validity, payment, and entitlement details."
        query={list.query}
        setQuery={list.setQuery}
        onRefresh={list.refresh}
        isSyncing={list.loading}
        right={<AdminLimitSelect limit={list.limit} setLimit={list.setLimit} />}
      />
      {list.error ? <Alert variant="danger">{list.error}</Alert> : null}
      {summary.length ? (
        <div className="flex flex-wrap gap-2">
          {summary.map((s) => (
            <Badge key={s.plan} className="text-[10px] font-black uppercase tracking-widest">
              {s.plan}: {s.count}
            </Badge>
          ))}
        </div>
      ) : null}

      {list.loading && !list.items.length ? (
        <TableSkeleton cols={9} rows={10} />
      ) : (
        <>
          <AdminTable
            columns={[
              { key: "workspace", label: "Workspace" },
              { key: "workspaceId", label: "Workspace ID" },
              { key: "owner", label: "Owner" },
              { key: "plan", label: "Plan" },
              { key: "status", label: "Subscription Status" },
              { key: "purchased", label: "Purchased" },
              { key: "validFrom", label: "Valid From" },
              { key: "validUntil", label: "Valid Until" },
              { key: "amount", label: "Amount" },
            ]}
          >
            {list.items.length ? (
              list.items.map((w: any) => {
                const sub = w.subscription || {};
                return (
                  <tr key={w.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`${base}/${w.id}`)}>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{w.name}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{w.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{w.owner?.email || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{sub.planName || w.plan || "-"}</td>
                    <td className="px-6 py-4 text-xs font-black uppercase text-slate-600">{sub.subscriptionStatus || "-"}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{sub.purchasedAt ? new Date(sub.purchasedAt).toLocaleString() : "-"}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{sub.validFrom ? new Date(sub.validFrom).toLocaleDateString() : "-"}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{sub.validUntil ? new Date(sub.validUntil).toLocaleDateString() : "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{inr(sub.payableAmountPaise)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={9}>
                  No subscription data available.
                </td>
              </tr>
            )}
          </AdminTable>
          <AdminPagination page={list.page} totalPages={list.totalPages} total={list.total} onPageChange={list.setPage} />
        </>
      )}
    </div>
  );
}

function SubscriptionWorkspaceDetail() {
  const { workspaceId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
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

  const history = useScrollList(
    useCallback(
      (page: number) =>
        API.admin.subscriptionWorkspaceHistory(workspaceId, { page, limit: 20 }).then((r: any) => ({
          items: r?.data?.items || [],
          totalPages: Number(r?.data?.pagination?.totalPages || 1),
        })),
      [workspaceId]
    )
  );
  const paymentLinks = useScrollList(
    useCallback(
      (page: number) =>
        API.admin.subscriptionWorkspacePaymentLinks(workspaceId, { page, limit: 20 }).then((r: any) => ({
          items: r?.data?.items || [],
          totalPages: Number(r?.data?.pagination?.totalPages || 1),
        })),
      [workspaceId]
    )
  );

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    setOverviewError("");
    try {
      const [o, p] = await Promise.all([API.admin.subscriptionWorkspaceOverview(workspaceId), API.billing.plans()]);
      setOverview(o?.data?.item || null);
      setPlans(Array.isArray(p?.data?.plans) ? p.data.plans : []);
    } catch (e: any) {
      setOverviewError(e?.response?.data?.message || "Failed to load overview");
    } finally {
      setLoadingOverview(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadOverview();
    history.reset();
    paymentLinks.reset();
  }, [loadOverview]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentPlan = useMemo(() => plans.find((p) => String(p.id) === String(selectedPlanId)) || null, [plans, selectedPlanId]);
  const pricing = useMemo(() => {
    const p = currentPlan?.pricing || {};
    return {
      original: Number(p.originalPricePaise || 0),
      discounted: Number(p.discountedPricePaise || 0),
      discountAmount: Number(p.discountAmountPaise || 0),
      discountPercent: Number(p.discountPercent || 0),
      gstPercent: Number(p.gstPercent || 0),
      gstAmount: Number(p.gstAmountPaise || 0),
      payable: Number(p.payableAmountPaise || 0),
    };
  }, [currentPlan]);

  async function submitAssign() {
    if (!selectedPlanId) return;
    setAssignLoading(true);
    try {
      await API.admin.assignWorkspacePlan(workspaceId, {
        planId: selectedPlanId,
        durationMonths,
        reason: reason || "Manual override",
        paymentMode: "manual",
      });
      setAssignConfirmOpen(false);
      setAssignModalOpen(false);
      toast("Plan assigned successfully", "success");
      await Promise.all([loadOverview(), history.reset()]);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to assign plan", "error");
    } finally {
      setAssignLoading(false);
    }
  }

  async function disableActivePlan() {
    setDisablePlanLoading(true);
    try {
      await API.admin.disableActiveWorkspacePlan(workspaceId);
      toast("Active plan disabled", "success");
      setDisablePlanConfirmOpen(false);
      await Promise.all([loadOverview(), history.reset()]);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to disable active plan", "error");
    } finally {
      setDisablePlanLoading(false);
    }
  }

  async function submitCreatePaymentLink() {
    if (!selectedPlanId) return;
    setLinkLoading(true);
    try {
      const out = await API.admin.createWorkspacePaymentLink(workspaceId, {
        planId: selectedPlanId,
        durationMonths,
        expiresInHours: 72,
      });
      setGeneratedLink(out?.data?.item || null);
      setLinkConfirmOpen(false);
      setLinkModalOpen(false);
      setLinkResultModalOpen(true);
      await paymentLinks.reset();
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to generate payment link", "error");
    } finally {
      setLinkLoading(false);
    }
  }

  async function copyGeneratedLink() {
    const url = generatedLink?.purchaseUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setGeneratedLink(null);
        setLinkResultModalOpen(false);
        setLinkConfirmOpen(false);
        setLinkModalOpen(false);
      }, 700);
    } catch {
      toast("Copy failed", "error");
    }
  }

  async function cancelPaymentLink(id: string) {
    try {
      await API.admin.cancelWorkspacePaymentLink(id);
      toast("Payment link disabled", "success");
      await paymentLinks.reset();
      if (selectedModalItem?.row?.id === id) setSelectedModalItem(null);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to disable link", "error");
    }
  }

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const onScroll = () => {
      if (node.scrollTop + node.clientHeight < node.scrollHeight - 160) return;
      if (tab === "history") history.loadMore();
      if (tab === "payment-links") paymentLinks.loadMore();
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, [tab, history, paymentLinks]);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8 pb-20">
      <div className="rounded-[5px] border border-slate-200 bg-white p-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-black text-slate-900">Workspace Subscription Overview</div>
          <div className="text-xs text-slate-500 mt-1">{workspaceId}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate(base)}>Back</Button>
          <Button variant="ghost" onClick={loadOverview}>Refresh</Button>
          <Button variant="danger" onClick={() => setDisablePlanConfirmOpen(true)}>Disable Active Plan</Button>
          <Button onClick={() => setAssignModalOpen(true)}>Assign Plan</Button>
        </div>
      </div>

      {overviewError ? <Alert variant="danger">{overviewError}</Alert> : null}

      <div className="rounded-[5px] border border-slate-200 bg-white p-2 flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          {(["overview", "payment-links", "history"] as TabKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`rounded-[5px] px-3 py-2 text-xs font-black uppercase tracking-wider ${tab === k ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {k}
            </button>
          ))}
        </div>
        {tab === "payment-links" ? <Button onClick={() => setLinkModalOpen(true)}>Create Link</Button> : null}
      </div>

      <div ref={scrollRef} className="rounded-[5px] border border-slate-200 bg-white p-4 max-h-[70vh] overflow-y-auto">
        {loadingOverview && !overview ? <TableSkeleton cols={4} rows={8} /> : null}
        {tab === "overview" && overview ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <UsageCard title="Contacts" data={overview.usage?.contacts} />
              <UsageCard title="Templates" data={overview.usage?.templates} />
              <UsageCard title="Employees" data={overview.usage?.employees} />
              <UsageCard title="Campaigns" data={overview.usage?.campaigns} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <JsonCard title="Features Enabled" data={overview.subscription?.features || {}} />
              <JsonCard title="Limits" data={overview.subscription?.limits || {}} />
            </div>
          </div>
        ) : null}
        {tab === "history" ? (
          <div className="space-y-3">
            {history.items.map((row) => (
              <div key={row.id} className="rounded-[5px] border border-slate-200 p-3 cursor-pointer hover:bg-slate-50" onClick={() => setSelectedModalItem({ type: "history", row })}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-900">{row.planName || row.planSlug || "-"}</div>
                  <Badge className="text-[10px]">{row.status || "-"}</Badge>
                </div>
                <div className="mt-2 text-xs text-slate-600">Payment Type: {row.paymentType || "-"}</div>
                <div className="text-xs text-slate-600">Transaction: {row.transactionId || "-"}</div>
                <div className="text-xs text-slate-600">Period: {toIst(row.currentPeriodStart)} - {toIst(row.currentPeriodEnd)}</div>
                <div className="text-xs text-slate-600">Payable: {inr(row.payableAmountPaise)}</div>
              </div>
            ))}
            {history.loading ? <div className="text-xs text-slate-500">Loading...</div> : null}
            {history.error ? <Alert variant="danger">{history.error}</Alert> : null}
          </div>
        ) : null}
        {tab === "payment-links" ? (
          <div className="space-y-3">
            {paymentLinks.items.map((row) => (
              <div key={row.id} className="rounded-[5px] border border-slate-200 p-3 cursor-pointer hover:bg-slate-50" onClick={() => setSelectedModalItem({ type: "payment-link", row })}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-900">{row.planName || row.planSlug || row.id}</div>
                  <Badge className="text-[10px]">{row.status}</Badge>
                </div>
                <div className="mt-2 text-xs text-slate-600">Duration: {row.durationMonths} month(s)</div>
                <div className="text-xs text-slate-600">Expires: {row.expiresAt ? new Date(row.expiresAt).toLocaleString() : "-"}</div>
                <div className="text-xs text-slate-600">Payable: {inr(row.amountSummary?.payableAmountPaise)}</div>
              </div>
            ))}
            {paymentLinks.loading ? <div className="text-xs text-slate-500">Loading...</div> : null}
            {paymentLinks.error ? <Alert variant="danger">{paymentLinks.error}</Alert> : null}
          </div>
        ) : null}
      </div>

      {assignModalOpen ? (
        <PlanModal
          title="Assign Plan"
          plans={plans}
          selectedPlanId={selectedPlanId}
          setSelectedPlanId={setSelectedPlanId}
          durationMonths={durationMonths}
          setDurationMonths={setDurationMonths}
          reason={reason}
          setReason={setReason}
          pricing={pricing}
          currentPlan={currentPlan}
          onClose={() => setAssignModalOpen(false)}
          onProceed={() => setAssignConfirmOpen(true)}
          proceedLabel="Assign Now"
        />
      ) : null}

      {linkModalOpen ? (
        <PlanModal
          title="Create Payment Link"
          plans={plans}
          selectedPlanId={selectedPlanId}
          setSelectedPlanId={setSelectedPlanId}
          durationMonths={durationMonths}
          setDurationMonths={setDurationMonths}
          reason=""
          setReason={() => {}}
          hideReason
          pricing={pricing}
          currentPlan={currentPlan}
          onClose={() => setLinkModalOpen(false)}
          onProceed={() => setLinkConfirmOpen(true)}
          proceedLabel="Generate Payment Link"
        />
      ) : null}

      {assignConfirmOpen ? (
        <ConfirmModal
          title="Confirm Plan Override"
          text="Existing active plan will be overridden for this workspace. Continue?"
          onNo={() => setAssignConfirmOpen(false)}
          onYes={submitAssign}
          loading={assignLoading}
          yesLabel="Yes, Assign"
        />
      ) : null}

      {disablePlanConfirmOpen ? (
        <ConfirmModal
          title="Disable Active Plan"
          text="Are you sure? Active plan will be disabled for this workspace."
          onNo={() => setDisablePlanConfirmOpen(false)}
          onYes={disableActivePlan}
          loading={disablePlanLoading}
          yesLabel="Yes, Disable"
        />
      ) : null}

      {linkConfirmOpen ? (
        <ConfirmModal
          title="Generate Payment Link"
          text="Proceed to generate single-use payment link for selected plan and duration?"
          onNo={() => setLinkConfirmOpen(false)}
          onYes={submitCreatePaymentLink}
          loading={linkLoading}
          yesLabel="Yes, Generate"
        />
      ) : null}

      {linkResultModalOpen && generatedLink ? (
        <div className="fixed inset-0 z-[999] bg-slate-900/45 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-[5px] border border-slate-200 bg-white p-5 md:p-6">
            <div className="text-lg font-black text-slate-900">Payment Link Generated</div>
            <div className="mt-3 rounded-[5px] border border-slate-200 bg-slate-50 p-3 text-xs break-all">{generatedLink.purchaseUrl}</div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => { setGeneratedLink(null); setLinkResultModalOpen(false); }}>Close</Button>
              <Button onClick={copyGeneratedLink}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span className="ml-2">{copied ? "Copied" : "Copy Link"}</span>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedModalItem?.type === "payment-link" ? (
        <PaymentLinkDetailModal
          row={selectedModalItem.row}
          onClose={() => setSelectedModalItem(null)}
          onDisable={() => cancelPaymentLink(selectedModalItem.row.id)}
        />
      ) : null}

      {selectedModalItem?.type === "history" ? (
        <HistoryDetailModal row={selectedModalItem.row} onClose={() => setSelectedModalItem(null)} />
      ) : null}
    </div>
  );
}

function PlanModal(props: any) {
  return (
    <div className="fixed inset-0 z-[999] bg-slate-900/45 backdrop-blur-sm p-4 flex items-center justify-center" onClick={props.onClose}>
      <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-[5px] border border-slate-200 bg-white p-5 md:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900">{props.title}</h3>
          <Button variant="ghost" onClick={props.onClose}>Close</Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-3">
            <Select label="Plan" value={props.selectedPlanId} onChange={(e) => props.setSelectedPlanId(e.target.value)}>
              <option value="">Select plan</option>
              {props.plans.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <Input label="Duration Months" type="number" min={1} max={24} value={String(props.durationMonths)} onChange={(e) => props.setDurationMonths(Number(e.target.value || 1))} />
            {!props.hideReason ? <Input label="Reason" value={props.reason} onChange={(e) => props.setReason(e.target.value)} placeholder="Override reason" /> : null}
            <PriceSummary pricing={props.pricing} />
            <div className="flex items-center gap-2">
              <Button disabled={!props.selectedPlanId} onClick={props.onProceed}>{props.proceedLabel}</Button>
            </div>
          </div>
          <div className="sticky top-3">
            {props.currentPlan ? (
              <SuperAdminPlanPreviewCard
                name={props.currentPlan.name}
                description={props.currentPlan.description}
                discountedPriceRupees={String(Math.round(Number(props.currentPlan.pricing?.discountedPricePaise || 0) / 100))}
                badgeText={props.currentPlan.ui?.badgeText || props.currentPlan.badgeText}
                recommended={Boolean(props.currentPlan.ui?.recommended || props.currentPlan.recommended)}
                displayFeatures={props.currentPlan.displayFeatures || []}
                unavailableFeatures={props.currentPlan.unavailableFeatures || []}
              />
            ) : (
              <div className="rounded-[5px] border border-slate-200 p-4 text-sm text-slate-500">Select a plan to preview.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceSummary({ pricing }: { pricing: any }) {
  return (
    <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-3 text-xs">
      <div className="font-black text-slate-900 mb-2">Payment Summary</div>
      <div className="grid grid-cols-2 gap-2">
        <span>Original Price</span><span className="text-right">{inr(pricing.original)}</span>
        <span>Discount</span><span className="text-right">{inr(pricing.discountAmount)} ({pricing.discountPercent}%)</span>
        <span>Discounted Price</span><span className="text-right">{inr(pricing.discounted)}</span>
        <span>GST ({pricing.gstPercent}%)</span><span className="text-right">{inr(pricing.gstAmount)}</span>
        <span className="font-black">Total Payable</span><span className="text-right font-black">{inr(pricing.payable)}</span>
      </div>
    </div>
  );
}

function ConfirmModal({ title, text, onNo, onYes, loading, yesLabel }: any) {
  return (
    <div className="fixed inset-0 z-[999] bg-slate-900/50 p-4 flex items-center justify-center" onClick={onNo}>
      <div className="w-full max-w-md rounded-[5px] border border-slate-200 bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <div className="text-base font-black text-slate-900">{title}</div>
        <div className="text-sm text-slate-600 mt-2">{text}</div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onNo}>No</Button>
          <Button disabled={loading} onClick={onYes}>{loading ? "Please wait..." : yesLabel}</Button>
        </div>
      </div>
    </div>
  );
}

function PaymentLinkDetailModal({ row, onClose, onDisable }: any) {
  const amount = row.amountSummary || {};
  return (
    <div className="fixed inset-0 z-[999] bg-slate-900/45 backdrop-blur-sm p-4 flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[5px] border border-slate-200 bg-white p-5 md:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900">Payment Link Details</h3>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-[5px] border border-slate-200 p-4 space-y-2 text-sm">
            <div><span className="font-black">Status:</span> {row.status}</div>
            <div><span className="font-black">Single Use:</span> {row.singleUse ? "Yes" : "No"}</div>
            <div><span className="font-black">Plan:</span> {row.planName || row.planSlug || "-"}</div>
            <div><span className="font-black">Duration:</span> {row.durationMonths} month(s)</div>
            <div><span className="font-black">Link Valid Until:</span> {row.expiresAt ? new Date(row.expiresAt).toLocaleString() : "-"}</div>
            <PriceSummary pricing={{
              original: amount.originalPricePaise || 0,
              discountAmount: amount.discountAmountPaise || 0,
              discountPercent: amount.discountPercent || 0,
              discounted: amount.discountedPricePaise || 0,
              gstPercent: amount.gstPercent || 0,
              gstAmount: amount.gstAmountPaise || 0,
              payable: amount.payableAmountPaise || 0,
            }} />
          </div>
          <div>
            <SuperAdminPlanPreviewCard
              name={row.planName || "Plan"}
              description={`Payment link for ${row.durationMonths} month(s)`}
              discountedPriceRupees={String(Math.round(Number(amount.discountedPricePaise || 0) / 100))}
              badgeText={`Status: ${row.status}`}
              recommended={false}
              displayFeatures={[
                `Total payable ${inr(amount.payableAmountPaise)}`,
                `GST ${amount.gstPercent || 0}%`,
                `Single use link`,
              ]}
              unavailableFeatures={row.status === "active" ? ["Disable if payment is pending"] : []}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          {row.status === "active" ? <Button variant="danger" onClick={onDisable}>Disable Link</Button> : null}
        </div>
      </div>
    </div>
  );
}

function HistoryDetailModal({ row, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[999] bg-slate-900/45 backdrop-blur-sm p-4 flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[5px] border border-slate-200 bg-white p-5 md:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900">Subscription History Detail</h3>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-[5px] border border-slate-200 p-3">
            <div className="text-xs font-black uppercase text-slate-500 mb-2">Plan</div>
            <div className="font-semibold text-slate-900">{row.planName || "-"}</div>
            <div className="text-xs text-slate-600 mt-1">Slug: {row.planSlug || "-"}</div>
            <div className="text-xs text-slate-600 mt-1">Status: {row.status || "-"}</div>
          </div>
          <div className="rounded-[5px] border border-slate-200 p-3">
            <div className="text-xs font-black uppercase text-slate-500 mb-2">Validity</div>
            <div className="text-xs text-slate-700">From: {toIst(row.currentPeriodStart)}</div>
            <div className="text-xs text-slate-700 mt-1">Until: {toIst(row.currentPeriodEnd)}</div>
            <div className="text-xs text-slate-700 mt-1">Duration: {row.durationMonths || "-"} month(s)</div>
          </div>
          <div className="rounded-[5px] border border-slate-200 p-3">
            <div className="text-xs font-black uppercase text-slate-500 mb-2">Payment</div>
            <div className="text-xs text-slate-700">Type: {row.paymentType || "-"}</div>
            <div className="text-xs text-slate-700 mt-1">Transaction ID: {row.transactionId || "-"}</div>
            <div className="text-xs text-slate-700 mt-1">Amount: {inr(row.amountPaidPaise)}</div>
            <div className="text-xs text-slate-700 mt-1">GST: {inr(row.gstAmountPaise)}</div>
            <div className="text-xs font-bold text-slate-900 mt-1">Payable: {inr(row.payableAmountPaise)}</div>
          </div>
          <div className="rounded-[5px] border border-slate-200 p-3">
            <div className="text-xs font-black uppercase text-slate-500 mb-2">Audit</div>
            <div className="text-xs text-slate-700">Created (IST): {toIst(row.createdAt)}</div>
            <div className="text-xs text-slate-700 mt-1">Auto Renew: {row.autoRenewEnabled ? "Enabled" : "Disabled"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageCard({ title, data }: { title: string; data?: any }) {
  const used = Number(data?.used || 0);
  const limit = data?.limit;
  const remaining = data?.remaining;
  const percent = Number(data?.percent || 0);
  return (
    <div className="rounded-[5px] border border-slate-200 p-3">
      <div className="text-xs font-black uppercase tracking-wider text-slate-500">{title}</div>
      <div className="mt-2 text-lg font-black text-slate-900">{used}{limit == null ? " / ∞" : ` / ${limit}`}</div>
      <div className="text-xs text-slate-600 mt-1">Remaining: {remaining == null ? "∞" : remaining}</div>
      <div className="mt-2 h-2 rounded bg-slate-100">
        <div className="h-2 rounded bg-brand-600" style={{ width: `${Math.max(4, Math.min(100, percent))}%` }} />
      </div>
    </div>
  );
}

function JsonCard({ title, data }: { title: string; data: any }) {
  return (
    <div className="rounded-[5px] border border-slate-200 p-3">
      <div className="text-xs font-black uppercase text-slate-500 mb-2">{title}</div>
      <pre className="text-xs text-slate-700 whitespace-pre-wrap break-all">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default function AdminSubscriptionsDataPage() {
  const { workspaceId } = useParams();
  if (workspaceId) return <SubscriptionWorkspaceDetail />;
  return <SubscriptionsList />;
}
