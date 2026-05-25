import { useEffect, useMemo, useState } from "react";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { useAuth } from "@shared/providers/AuthContext";
import { useToast } from "@shared/providers/ToastContext";
import { usePlans } from "@modules/billing/hooks/usePlans";
import { API } from "@api/api";
import { useNavigate } from "react-router-dom";
import { CurrentPlanModal } from "./plan/CurrentPlanModal";
import { PlanCard } from "./plan/PlanCard";
import { SalesContactModal } from "./plan/SalesContactModal";

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
};

export default function PlanPage() {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { items: livePlans, loading, error } = usePlans();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [currentModalOpen, setCurrentModalOpen] = useState(false);
  const [currentDetails, setCurrentDetails] = useState<any>(null);

  const plans: PlanItem[] = useMemo(
    () =>
      (Array.isArray(livePlans) ? livePlans : [])
        .map((p: any) => ({
          id: String(p?.id || p?.slug || p?.name || ""),
          slug: String(p?.slug || "").toLowerCase(),
          name: p?.name || "Plan",
          price:
            p?.pricing?.discountedPricePaise == null
              ? "Custom"
              : `?${Math.round(Number(p.pricing.discountedPricePaise) / 100).toLocaleString("en-IN")}`,
          period: p?.pricing?.discountedPricePaise == null || String(p?.slug || "").toLowerCase() === "free" ? "" : "/month",
          description: p?.description || "",
          features: Array.isArray(p?.displayFeatures) ? p.displayFeatures : [],
          notIncluded: Array.isArray(p?.unavailableFeatures) ? p.unavailableFeatures : [],
          cta: p?.buttonText || (p?.planType === "custom" ? "Contact Sales" : "Buy Now"),
          planType: p?.planType || "basic",
          recommended: Boolean(p?.recommended),
          isCurrentPlan: String((workspace?.plan || "").toLowerCase()) === String((p?.slug || "").toLowerCase()),
        }))
        .sort((a, b) => (a.slug === "free" ? -1 : b.slug === "free" ? 1 : 0)),
    [livePlans, workspace?.plan]
  );

  const currentPlan = plans.find((p) => p.isCurrentPlan);
  const topPlans = plans.slice(0, 3);
  const horizontalPlan = plans[3] || null;

  const usageCards = useMemo(() => {
    const usage = currentDetails?.usage || {};
    return [
      { key: "contacts", label: "Contacts", data: usage.contacts },
      { key: "templates", label: "Templates", data: usage.templates },
      { key: "employees", label: "Employees", data: usage.employees },
      { key: "campaigns", label: "Campaigns", data: usage.campaigns },
    ];
  }, [currentDetails]);

  useEffect(() => {
    let mounted = true;
    API.billing.current().then((res: any) => mounted && setCurrentDetails(res || null)).catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  async function handlePlanAction(planName: string) {
    const selected = plans.find((plan) => plan.name === planName);
    if (selected?.planType === "custom") {
      setSelectedPlan(planName);
      return;
    }
    if (!planName) return;

    setPaymentProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast("Redirecting to payment gateway...", "success");
    } catch {
      toast("Payment initialization failed", "error");
    } finally {
      setPaymentProcessing(false);
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-ink-900">Plans & Pricing</h1>
        <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-ink-800/60">Choose the perfect plan for your business</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-ink-800">
            Current Plan: <span className="font-black text-brand-600">{currentPlan?.name} ({workspace?.plan || "Free"})</span>
          </p>
          <Button variant="ghost" onClick={() => navigate("/app/plan/history")}>History</Button>
        </div>
      </div>

      {loading ? <Card className="border-slate-200 p-6 text-sm font-semibold text-slate-500">Loading plans...</Card> : null}
      {!loading && error ? <Card className="border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">{error}</Card> : null}
      {!loading && !error && plans.length === 0 ? (
        <Card className="border-slate-200 p-6 text-sm font-semibold text-slate-500">No plans are published yet. Please check back soon.</Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-3">
        {topPlans.map((plan) => (
          <PlanCard
            key={plan.id || plan.name}
            plan={plan}
            paymentProcessing={paymentProcessing}
            onCurrentPlanClick={() => setCurrentModalOpen(true)}
            onActionClick={handlePlanAction}
          />
        ))}
        {horizontalPlan ? (
          <PlanCard
            plan={horizontalPlan}
            horizontal
            paymentProcessing={paymentProcessing}
            onCurrentPlanClick={() => setCurrentModalOpen(true)}
            onActionClick={handlePlanAction}
          />
        ) : null}
      </div>

      <div className="mt-12 space-y-6">
        <h2 className="text-2xl font-black text-slate-900">Frequently Asked Questions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-slate-200 p-6"><h3 className="font-black text-slate-900">Can I switch plans?</h3><p className="mt-2 text-sm font-semibold text-slate-600">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p></Card>
          <Card className="border-slate-200 p-6"><h3 className="font-black text-slate-900">What payment methods do you accept?</h3><p className="mt-2 text-sm font-semibold text-slate-600">We accept all major credit cards, bank transfers, and online payment methods.</p></Card>
          <Card className="border-slate-200 p-6"><h3 className="font-black text-slate-900">Is there a money-back guarantee?</h3><p className="mt-2 text-sm font-semibold text-slate-600">Yes, if you're not satisfied, we offer a 30-day money-back guarantee.</p></Card>
          <Card className="border-slate-200 p-6"><h3 className="font-black text-slate-900">Do you offer discounts for annual billing?</h3><p className="mt-2 text-sm font-semibold text-slate-600">Yes, save 20% when you choose annual billing instead of monthly.</p></Card>
        </div>
      </div>

      <Card className="border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-600">
        WhatsApp/message charges are billed separately from wallet balance where applicable.
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
