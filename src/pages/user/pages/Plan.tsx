import { useEffect, useMemo, useState } from "react";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { useAuth } from "@shared/providers/AuthContext";
import { useToast } from "@shared/providers/ToastContext";
import { usePlans } from "@modules/billing/hooks/usePlans";
import { API } from "@api/api";
import { CurrentPlanModal } from "./plan/CurrentPlanModal";
import { PlanCard } from "./plan/PlanCard";
import { SalesContactModal } from "./plan/SalesContactModal";
import { loadRazorpay } from "@shared/utils/loadRazorpay";
import { BRAND_NAME } from "@shared/config/brand";

type PlanItem = {
  id: string;
  slug: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  notIncluded: string[];
  cta: string;
  planType: string;
  recommended: boolean;
  isCurrentPlan: boolean;
  payableAmountPaise: number;
  rank: number;
  relation: "current" | "upgrade" | "downgrade" | "same";
  actionLabel?: string;
  actionDisabled?: boolean;
  actionHint?: string;
  scheduleBadge?: string;
  scheduleBadgeTone?: "current" | "scheduled";
};

const PLAN_RANK: Record<string, number> = { free: 0, basic: 1, pro: 2, premium: 3, unlimited: 4 };
const TABS = [
  ["overview", "Overview"],
  ["plans", "Plans"],
  ["usage", "Usage & Limits"],
  ["history", "History"],
  ["invoices", "Invoices"],
  ["timeline", "Timeline"],
] as const;

function inrFromPaise(paise?: number | null) {
  if (paise == null) return "Custom";
  return `₹${Math.round(Number(paise) / 100).toLocaleString("en-IN")}`;
}

function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function paiseToRupees(value?: number | null) {
  return `₹${Math.round(Number(value || 0) / 100).toLocaleString("en-IN")}`;
}

function daysRemaining(value?: string | Date | null) {
  if (!value) return null;
  const ms = new Date(value).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export default function PlanPage() {
  const { workspace, user, refreshMe } = useAuth();
  const { toast } = useToast();
  const { items: livePlans, loading, error } = usePlans();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [currentModalOpen, setCurrentModalOpen] = useState(false);
  const [currentDetails, setCurrentDetails] = useState<any>(null);
  const [historyRows, setHistoryRows] = useState<any[]>([]);
  const [invoiceRows, setInvoiceRows] = useState<any[]>([]);
  const [timelineRows, setTimelineRows] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number][0]>("overview");

  const currentSlug = String(currentDetails?.effective?.plan || workspace?.plan || "free").toLowerCase();
  const currentRank = PLAN_RANK[currentSlug] ?? 0;
  const scheduledChange = currentDetails?.subscription?.scheduledChange || null;
  const renewalDue = currentDetails?.renewal || null;
  const autoRenew = currentDetails?.subscription || {};

  const plans: PlanItem[] = useMemo(
    () =>
      (Array.isArray(livePlans) ? livePlans : [])
        .map((plan: any) => {
          const slug = String(plan?.slug || "").toLowerCase();
          const rank = PLAN_RANK[slug] ?? Number(plan?.sortOrder || 99);
          const isCurrentPlan = currentSlug === slug;
          const relation = isCurrentPlan ? "current" : rank > currentRank ? "upgrade" : rank < currentRank ? "downgrade" : "same";
          const isScheduledTarget = scheduledChange?.planSlug === slug;
          const currentScheduleBadge =
            isCurrentPlan && scheduledChange?.planName
              ? `Downgrades to ${scheduledChange.planName} on ${formatDate(scheduledChange.effectiveAt)}`
              : "";
          return {
            id: String(plan?.id || plan?._id || plan?.slug || plan?.name || ""),
            slug,
            name: plan?.name || "Plan",
            price: slug === "free" ? "Free" : inrFromPaise(plan?.pricing?.discountedPricePaise),
            period: plan?.pricing?.discountedPricePaise == null || slug === "free" ? "" : "/month",
            description: plan?.description || "",
            features: Array.isArray(plan?.displayFeatures) ? plan.displayFeatures : [],
            notIncluded: Array.isArray(plan?.unavailableFeatures) ? plan.unavailableFeatures : [],
            cta: plan?.buttonText || (plan?.planType === "custom" ? "Contact Sales" : "Buy Now"),
            planType: plan?.planType || "basic",
            recommended: Boolean(plan?.recommended),
            isCurrentPlan,
            payableAmountPaise: Number(plan?.pricing?.payableAmountPaise ?? plan?.pricing?.discountedPricePaise ?? 0),
            rank,
            relation,
            actionLabel: isScheduledTarget
              ? "Scheduled"
              : relation === "upgrade"
                ? "Upgrade"
                : relation === "downgrade"
                  ? "Schedule Downgrade"
                  : plan?.buttonText || "Buy Now",
            actionDisabled: isScheduledTarget || Boolean(scheduledChange?.planSlug && relation === "downgrade"),
            actionHint: isScheduledTarget
              ? `Switches on ${formatDate(scheduledChange.effectiveAt)}`
              : scheduledChange?.planSlug && relation === "downgrade"
                ? "Cancel current scheduled change first."
                : relation === "downgrade"
                  ? "Applies at current billing period end."
                  : "",
            scheduleBadge: isScheduledTarget ? "Scheduled" : currentScheduleBadge,
            scheduleBadgeTone: isScheduledTarget ? "scheduled" : "current",
          } as PlanItem;
        })
        .sort((a, b) => a.rank - b.rank),
    [livePlans, currentRank, currentSlug, scheduledChange]
  );

  const currentPlan = plans.find((plan) => plan.isCurrentPlan);

  const usageCards = useMemo(() => {
    const usage = currentDetails?.usage || {};
    return [
      { key: "contacts", label: "Contacts", data: usage.contacts },
      { key: "templates", label: "Templates", data: usage.templates },
      { key: "employees", label: "Agents", data: usage.employees },
      { key: "campaigns", label: "Campaigns", data: usage.campaigns },
    ];
  }, [currentDetails]);

  async function refreshSubscriptionState() {
    const [current, history, invoices, timeline] = await Promise.allSettled([
      API.billing.current(),
      API.billing.history({ limit: 20 }),
      API.billing.invoices({ limit: 20 }),
      API.billing.timeline({ limit: 30 }),
    ]);
    if (current.status === "fulfilled") setCurrentDetails(current.value || null);
    if (history.status === "fulfilled") setHistoryRows(history.value?.data?.items || []);
    if (invoices.status === "fulfilled") setInvoiceRows(invoices.value?.data?.items || []);
    if (timeline.status === "fulfilled") setTimelineRows(timeline.value?.data?.items || []);
    await refreshMe({ silent: true });
  }

  useEffect(() => {
    refreshSubscriptionState().catch(() => {});
  }, []);

  async function scheduleDowngrade(plan: PlanItem) {
    setPaymentProcessing(true);
    try {
      await API.billing.scheduleDowngrade({ planId: plan.id });
      await refreshSubscriptionState();
      toast(`${plan.name} downgrade scheduled for period end`, "success");
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || "Failed to schedule downgrade", "error");
    } finally {
      setPaymentProcessing(false);
    }
  }

  async function cancelScheduledChange() {
    setPaymentProcessing(true);
    try {
      await API.billing.cancelScheduledChange();
      await refreshSubscriptionState();
      toast("Scheduled plan change cancelled", "success");
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || "Failed to cancel scheduled change", "error");
    } finally {
      setPaymentProcessing(false);
    }
  }

  async function handleRenewalPayment(retry = false) {
    const invoiceId = renewalDue?.invoice?.id;
    setPaymentProcessing(true);
    try {
      const checkout = retry ? await API.billing.retryRenewal({ invoiceId }) : await API.billing.renew({ invoiceId });
      const data = checkout?.data || checkout;
      await loadRazorpay();
      if (!window.Razorpay) throw new Error("Razorpay checkout unavailable");

      await new Promise<void>((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: data.publicKey,
          amount: data.amount,
          currency: data.currency || "INR",
          name: BRAND_NAME,
          description: `${data.plan?.name || renewalDue?.targetPlan?.name || "Plan"} renewal`,
          order_id: data.orderId,
          prefill: { name: user?.name || "", email: user?.email || "", contact: user?.phone || "" },
          notes: { workspaceId: workspace?.id || "", invoiceId: data.invoice?.id || invoiceId || "" },
          handler: async (response: any) => {
            try {
              await API.billing.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              await refreshSubscriptionState();
              toast(`${data.plan?.name || "Plan"} renewed successfully`, "success");
              resolve();
            } catch (verificationError) {
              reject(verificationError);
            }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        });
        razorpay.open();
      });
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Renewal payment failed";
      toast(message, message === "Payment cancelled" ? "info" : "error");
    } finally {
      setPaymentProcessing(false);
    }
  }

  async function handleEnableAutoRenew(changeMethod = false) {
    setPaymentProcessing(true);
    try {
      const setup = changeMethod ? await API.billing.changePaymentMethod() : await API.billing.enableAutoRenew();
      const data = setup?.data || setup;
      await loadRazorpay();
      if (!window.Razorpay) throw new Error("Razorpay checkout unavailable");

      await new Promise<void>((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: data.publicKey,
          name: BRAND_NAME,
          description: "Authorize recurring subscription payments",
          subscription_id: data.razorpaySubscriptionId,
          prefill: { name: user?.name || "", email: user?.email || "", contact: user?.phone || "" },
          notes: { workspaceId: workspace?.id || "", purpose: "auto_renew" },
          handler: async (response: any) => {
            try {
              await API.billing.confirmAutoRenew({
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              await refreshSubscriptionState();
              toast("Auto-renew enabled successfully", "success");
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: { ondismiss: () => reject(new Error("Auto-renew setup cancelled")) },
        });
        razorpay.open();
      });
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Auto-renew setup failed";
      toast(message, message === "Auto-renew setup cancelled" ? "info" : "error");
    } finally {
      setPaymentProcessing(false);
    }
  }

  async function handleDisableAutoRenew() {
    setPaymentProcessing(true);
    try {
      await API.billing.disableAutoRenew();
      await refreshSubscriptionState();
      toast("Auto-renew disabled", "success");
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || "Failed to disable auto-renew", "error");
    } finally {
      setPaymentProcessing(false);
    }
  }

  async function handlePlanAction(selected: PlanItem) {
    if (selected?.planType === "custom") {
      setSelectedPlan(selected.name);
      return;
    }
    if (!selected?.id || selected.actionDisabled) return;
    if (selected.relation === "downgrade") {
      await scheduleDowngrade(selected);
      return;
    }
    if (selected.slug === "free" || selected.payableAmountPaise <= 0) {
      toast("This plan does not require checkout.", "info");
      return;
    }

    setPaymentProcessing(true);
    try {
      const checkout = await API.billing.checkout({ planId: selected.id, durationMonths: 1 });
      const data = checkout?.data || checkout;
      await loadRazorpay();
      if (!window.Razorpay) throw new Error("Razorpay checkout unavailable");

      await new Promise<void>((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: data.publicKey,
          amount: data.amount,
          currency: data.currency || "INR",
          name: BRAND_NAME,
          description: `${data.plan?.name || selected.name} subscription`,
          order_id: data.orderId,
          prefill: { name: user?.name || "", email: user?.email || "", contact: user?.phone || "" },
          notes: { workspaceId: workspace?.id || "", planSlug: selected.slug },
          handler: async (response: any) => {
            try {
              await API.billing.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              await refreshSubscriptionState();
              toast(`${selected.name} activated successfully`, "success");
              resolve();
            } catch (verificationError) {
              reject(verificationError);
            }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        });
        razorpay.open();
      });
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Payment initialization failed";
      toast(message, message === "Payment cancelled" ? "info" : "error");
    } finally {
      setPaymentProcessing(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-ink-900">Plans & Billing</h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-ink-800/60">
            Manage subscription, usage, upgrades, downgrades, and invoices
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-ink-800">
              Current Plan:{" "}
              <span className="font-black text-brand-600">
                {currentPlan?.name || currentSlug} ({currentDetails?.subscription?.status || "free"})
              </span>
            </p>
            <p className="text-xs font-bold text-slate-500">Expires: {formatDate(currentDetails?.subscription?.currentPeriodEnd)}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => setCurrentModalOpen(true)}>View Current Plan</Button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-[5px] border border-slate-200 bg-white p-2">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`rounded-[5px] px-4 py-2 text-xs font-black uppercase tracking-wide transition-colors ${
              activeTab === key ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <Card className="border-slate-200 p-6 text-sm font-semibold text-slate-500">Loading plans...</Card> : null}
      {!loading && error ? <Card className="border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">{error}</Card> : null}
      {!loading && !error && plans.length === 0 ? (
        <Card className="border-slate-200 p-6 text-sm font-semibold text-slate-500">No plans are published yet.</Card>
      ) : null}

      {scheduledChange && !renewalDue ? (
        <Card className="border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-amber-700">🟡 Scheduled Downgrade</div>
                <p className="mt-1 text-sm font-bold text-amber-950">
                  This is not active yet. Your current plan continues until the effective date.
                </p>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-700">Current Plan</div>
                  <div className="mt-1 font-black text-amber-950">{currentDetails?.subscription?.planName || currentPlan?.name || currentSlug}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-700">Next Plan</div>
                  <div className="mt-1 font-black text-amber-950">{scheduledChange.planName}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-700">Effective Date</div>
                  <div className="mt-1 font-black text-amber-950">{formatDate(scheduledChange.effectiveAt)}</div>
                </div>
              </div>
              <p className="max-w-3xl text-sm font-semibold leading-6 text-amber-900">
                You will continue enjoying all {currentDetails?.subscription?.planName || currentPlan?.name || "current plan"} features until{" "}
                {formatDate(scheduledChange.effectiveAt)}. After that, your workspace will automatically switch to the{" "}
                {scheduledChange.planName} plan unless you cancel this scheduled change.
              </p>
            </div>
            <Button variant="outline" onClick={cancelScheduledChange} disabled={paymentProcessing}>Cancel Scheduled Change</Button>
          </div>
        </Card>
      ) : null}

      {renewalDue ? (
        <Card className="border-rose-200 bg-rose-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-rose-700">🔴 Renewal Required</div>
                <p className="mt-1 max-w-3xl text-sm font-bold leading-6 text-rose-950">
                  Your current subscription has expired. Complete payment within{" "}
                  {daysRemaining(renewalDue.gracePeriodEndsAt) ?? 0} days to activate {renewalDue.targetPlan?.name || "the scheduled plan"}.
                  Otherwise your workspace will automatically move to the Free plan.
                </p>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-rose-700">Current Access</div>
                  <div className="mt-1 font-black text-rose-950">{currentDetails?.subscription?.planName || currentPlan?.name || currentSlug}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-rose-700">Renewal Plan</div>
                  <div className="mt-1 font-black text-rose-950">{renewalDue.targetPlan?.name || "Scheduled plan"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-rose-700">Invoice</div>
                  <div className="mt-1 font-black text-rose-950">{renewalDue.invoice?.invoiceNumber || "Pending"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-rose-700">Amount Due</div>
                  <div className="mt-1 font-black text-rose-950">{paiseToRupees(renewalDue.invoice?.totalPaise)}</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleRenewalPayment(false)} disabled={paymentProcessing}>Pay Now</Button>
              <Button variant="outline" onClick={() => handleRenewalPayment(true)} disabled={paymentProcessing}>Retry Payment</Button>
            </div>
          </div>
        </Card>
      ) : null}

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-slate-200 p-5">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">Active Plan</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{currentPlan?.name || currentSlug}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">Status: {currentDetails?.subscription?.status || "free"}</div>
            </Card>
            <Card className="border-slate-200 p-5">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">Cycle End</div>
              <div className="mt-2 text-lg font-black text-slate-900">{formatDate(currentDetails?.subscription?.currentPeriodEnd)}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">Auto renewal: {currentDetails?.subscription?.autoRenewEnabled ? "Enabled" : "Disabled"}</div>
            </Card>
            <Card className="border-slate-200 p-5">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">Plan Change</div>
              <div className="mt-2 text-sm font-bold text-slate-700">
                {renewalDue ? `Payment due for ${renewalDue.targetPlan?.name}` : scheduledChange ? `${scheduledChange.planName} scheduled` : "No pending changes"}
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-500">Upgrades instant; paid downgrades activate only after renewal payment.</div>
            </Card>
          </div>
          <Card className="border-slate-200 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-slate-500">Auto Renewal</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-[3px] px-3 py-1 text-[10px] font-black uppercase tracking-wider ${autoRenew.autoRenewEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {autoRenew.autoRenewEnabled ? "Auto Renew Enabled" : "Auto Renew Disabled"}
                  </span>
                  <span className="rounded-[3px] bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                    Mandate: {autoRenew.mandateStatus || "not_setup"}
                  </span>
                  {autoRenew.renewalStatus ? (
                    <span className="rounded-[3px] bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
                      {String(autoRenew.renewalStatus).replaceAll("_", " ")}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Renewal</div>
                    <div className="mt-1 font-black text-slate-900">{formatDate(autoRenew.nextRenewalDate || currentDetails?.subscription?.currentPeriodEnd)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Method</div>
                    <div className="mt-1 font-black text-slate-900">{autoRenew.paymentMethod?.label || "No mandate setup"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attempts</div>
                    <div className="mt-1 font-black text-slate-900">{Number(autoRenew.renewalAttempts || 0)}</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {autoRenew.autoRenewEnabled ? (
                  <>
                    <Button variant="outline" onClick={() => handleEnableAutoRenew(true)} disabled={paymentProcessing}>Change Payment Method</Button>
                    <Button variant="danger" onClick={handleDisableAutoRenew} disabled={paymentProcessing}>Disable Auto Renew</Button>
                  </>
                ) : (
                  <Button onClick={() => handleEnableAutoRenew(false)} disabled={paymentProcessing || currentSlug === "free"}>Enable Auto Renew</Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "plans" ? (
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id || plan.name}
              plan={plan}
              paymentProcessing={paymentProcessing}
              onCurrentPlanClick={() => setCurrentModalOpen(true)}
              onActionClick={handlePlanAction}
            />
          ))}
        </div>
      ) : null}

      {activeTab === "usage" ? (
        <div className="grid gap-4 md:grid-cols-4">
          {usageCards.map((card) => (
            <Card key={card.key} className="border-slate-200 p-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">{card.label}</div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                {Number(card?.data?.used || 0)} / {card?.data?.limit == null ? "∞" : card.data.limit}
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-500">
                Remaining: {card?.data?.remaining == null ? "Unlimited" : card.data.remaining}
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {activeTab === "history" ? (
        <Card className="overflow-hidden border-slate-200 p-0">
          <div className="border-b border-slate-100 p-5 text-lg font-black text-slate-900">Subscription History</div>
          {historyRows.length ? historyRows.map((row) => (
            <div key={row.id} className="grid gap-3 border-b border-slate-100 p-4 text-sm md:grid-cols-5">
              <div className="font-black text-slate-900">{row.planName}</div>
              <div className="font-bold capitalize text-slate-600">{row.status}</div>
              <div className="font-semibold text-slate-500">{formatDate(row.validFrom)}</div>
              <div className="font-semibold text-slate-500">{formatDate(row.validUntil)}</div>
              <div className="font-black text-slate-900">{paiseToRupees(row.payableAmountPaise)}</div>
            </div>
          )) : <div className="p-5 text-sm font-semibold text-slate-500">No subscription history yet.</div>}
        </Card>
      ) : null}

      {activeTab === "invoices" ? (
        <Card className="overflow-hidden border-slate-200 p-0">
          <div className="border-b border-slate-100 p-5 text-lg font-black text-slate-900">Invoices</div>
          {invoiceRows.length ? invoiceRows.map((row) => (
            <div key={row.id} className="grid gap-3 border-b border-slate-100 p-4 text-sm md:grid-cols-5">
              <div className="font-black text-slate-900">{row.invoiceNumber}</div>
              <div className="font-bold text-slate-600">{row.planName}</div>
              <div className="font-semibold capitalize text-slate-500">{row.status}</div>
              <div className="font-semibold text-slate-500">{formatDate(row.createdAt)}</div>
              <div className="font-black text-slate-900">{paiseToRupees(row.totalPaise)}</div>
            </div>
          )) : <div className="p-5 text-sm font-semibold text-slate-500">No invoices generated yet.</div>}
        </Card>
      ) : null}

      {activeTab === "timeline" ? (
        <Card className="overflow-hidden border-slate-200 p-0">
          <div className="border-b border-slate-100 p-5 text-lg font-black text-slate-900">Billing Timeline</div>
          {timelineRows.length ? timelineRows.map((row) => (
            <div key={row.id} className="border-b border-slate-100 p-4">
              <div className="text-sm font-black text-slate-900">{String(row.action || "").replace(/^billing\./, "").replaceAll("_", " ")}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">{formatDate(row.createdAt)}</div>
              {row.metadata?.fromPlan || row.metadata?.toPlan ? (
                <div className="mt-1 text-xs font-bold text-slate-600">
                  {row.metadata.fromPlan || "—"} → {row.metadata.toPlan || "—"}
                </div>
              ) : null}
            </div>
          )) : <div className="p-5 text-sm font-semibold text-slate-500">No billing events yet.</div>}
        </Card>
      ) : null}

      <Card className="border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-600">
        WhatsApp/message charges are billed separately from subscription plan where applicable.
      </Card>

      <SalesContactModal open={selectedPlan !== null} onClose={() => setSelectedPlan(null)} planName={selectedPlan || ""} />
      <CurrentPlanModal
        open={currentModalOpen}
        onClose={() => setCurrentModalOpen(false)}
        title={currentDetails?.subscription?.planName || currentPlan?.name || "Active Plan"}
        usageCards={usageCards}
        details={currentDetails}
      />
    </div>
  );
}
