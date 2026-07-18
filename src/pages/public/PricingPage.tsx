import { Check, MessageCircle, Sparkles, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Card } from "@components/ui/Card";
import { useAuth } from "@shared/providers/AuthContext";
import { usePlans } from "@modules/billing/hooks/usePlans";
import { formatCurrencyFromPaise, useCurrencySymbol } from "@shared/config/currency";
import { cn } from "@shared/utils/cn";
import { LandingNavbar } from "@components/landing/LandingNavbar";
import { LandingFooter } from "@components/landing/LandingFooter";

function formatPrice(plan: any) {
  const paise = plan?.pricing?.discountedPricePaise;
  if (paise == null || String(plan?.slug || "").toLowerCase() === "free") return "Free";
  return formatCurrencyFromPaise(paise, "INR");
}

function cycleText(plan: any) {
  const cycle = String(plan?.pricing?.billingCycle || "monthly").toLowerCase();
  if (String(plan?.slug || "").toLowerCase() === "free") return "";
  if (cycle === "lifetime") return "one-time";
  return `/${cycle}`;
}

function buildPlanAction(plan: any, token?: string | null) {
  const slug = encodeURIComponent(String(plan?.slug || plan?.id || ""));
  if (String(plan?.slug || "").toLowerCase() === "free") return token ? "/app/dashboard" : `/register?plan=${slug}`;
  return token ? `/app/plan?plan=${slug}` : `/register?plan=${slug}`;
}

function limitChips(plan: any) {
  const limits = plan?.limits || {};
  return [
    limits.messageRatePerSec ? `${limits.messageRatePerSec}/sec speed` : "",
    limits.maxAgents ? `${limits.maxAgents} agents` : "",
    limits.maxTags ? `${limits.maxTags} tags` : "",
    limits.maxCustomAttributes ? `${limits.maxCustomAttributes} attributes` : "",
    limits.maxWebhooks ? `${limits.maxWebhooks} webhooks` : "",
  ].filter(Boolean);
}

function colorClasses(color: string, featured: boolean) {
  if (featured) return "border-emerald-400 shadow-emerald-500/20 ring-2 ring-emerald-400";
  const map: Record<string, string> = {
    blue: "border-blue-200 shadow-blue-500/10",
    green: "border-emerald-200 shadow-emerald-500/10",
    purple: "border-purple-200 shadow-purple-500/10",
    gold: "border-amber-200 shadow-amber-500/10",
    slate: "border-slate-200 shadow-slate-500/10",
  };
  return map[color] || map.slate;
}

function PricingCard({ plan, token, selected }: { plan: any; token?: string | null; selected?: boolean }) {
  const featured = Boolean(plan?.recommended);
  const included = Array.isArray(plan?.displayFeatures) ? plan.displayFeatures : [];
  const unavailable = Array.isArray(plan?.unavailableFeatures) ? plan.unavailableFeatures : [];
  const addonServices = Array.isArray(plan?.addonServices) ? plan.addonServices : [];
  const chips = limitChips(plan);

  return (
    <Card id={`plan-${plan.slug}`} className={cn("relative flex scroll-mt-28 flex-col rounded-[18px] border bg-white p-6 shadow-xl transition-all duration-300 hover:-translate-y-1", colorClasses(plan?.cardColor || "slate", featured), selected && "ring-4 ring-brand-300")}>
      {featured ? <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-white">{plan.badgeText || "Recommended"}</div> : null}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{plan.badgeType && plan.badgeType !== "none" ? plan.badgeType.replace(/_/g, " ") : "Plan"}</div>
          <h3 className="mt-2 text-2xl font-black text-slate-950">{plan.name}</h3>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">{plan.icon || "⭐"}</div>
      </div>

      <p className="mt-3 min-h-[44px] text-sm font-semibold leading-6 text-slate-500">{plan.description || "Scale WhatsApp campaigns, automation, and team inbox with a clean subscription plan."}</p>

      <div className="mt-6 flex items-end gap-1">
        <span className="text-4xl font-black tracking-tight text-slate-950">{formatPrice(plan)}</span>
        <span className="pb-1 text-sm font-bold text-slate-400">{cycleText(plan)}</span>
      </div>
      {plan?.pricing?.gstPercent ? <p className="mt-1 text-xs font-bold text-slate-400">+ GST as applicable</p> : <p className="mt-1 text-xs font-bold text-slate-400">No subscription payment required</p>}

      {chips.length ? <div className="mt-4 flex flex-wrap gap-2">{chips.map((chip) => <span key={chip} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">{chip}</span>)}</div> : null}

      <div className="mt-6 h-px bg-slate-100" />
      <ul className="mt-6 flex-1 space-y-3">
        {included.slice(0, 10).map((feature: string) => <li key={feature} className="flex gap-2.5 text-sm font-semibold text-slate-700"><Check size={17} className="mt-0.5 shrink-0 text-emerald-600" />{feature}</li>)}
        {!included.length ? <li className="text-sm font-semibold text-slate-400">Features will appear after admin configures display copy.</li> : null}
      </ul>
      {unavailable.length ? <div className="mt-5 space-y-2 border-t border-slate-100 pt-5">{unavailable.slice(0, 5).map((feature: string) => <div key={feature} className="flex gap-2.5 text-xs font-semibold text-slate-400"><X size={15} className="mt-0.5 shrink-0" />{feature}</div>)}</div> : null}
      {addonServices.length ? (
        <div className="mt-5 space-y-2 border-t border-slate-100 pt-5">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Add-on services</div>
          {addonServices.slice(0, 6).map((service: string) => (
            <div key={service} className="flex gap-2.5 text-xs font-semibold text-emerald-700">
              <Check size={15} className="mt-0.5 shrink-0" />
              {service}
            </div>
          ))}
        </div>
      ) : null}

      <Link to={buildPlanAction(plan, token)} className={cn("mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-black text-white transition-all active:scale-95", featured ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-950 hover:bg-slate-800")}>
        {plan.buttonText || (plan.isFreePlan ? "Start Free" : "Buy Now")}
      </Link>
    </Card>
  );
}

export default function PublicPricingPage() {
  useCurrencySymbol();
  const { token } = useAuth();
  const location = useLocation();
  const { items, loading, error } = usePlans();
  const params = new URLSearchParams(location.search);
  const selectedPlan = params.get("plan") || "";
  const plans = (Array.isArray(items) ? items : []).filter((plan: any) => plan?.publicVisible !== false).sort((a: any, b: any) => Number(a?.sortOrder || 0) - Number(b?.sortOrder || 0));

  return (
    <div>
      <LandingNavbar />
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7faf7_0%,#ffffff_45%,#f8fafc_100%)]">
        <section className="relative overflow-hidden px-4 pb-10 pt-24 md:px-8 md:pb-16 md:pt-28">
          <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="relative mx-auto max-w-6xl text-center">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-700 shadow-sm"><Sparkles size={14} /> Pricing</div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">Plans that scale with your Business growth</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-slate-600 md:text-lg">Published plans from Super Admin appear here automatically. Users can pick a plan, sign up, and continue purchase from their workspace.</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link to={token ? "/app/plan" : "/register"} className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-black text-white transition-colors hover:bg-emerald-700">Get Started</Link>
              <Link to="/login" className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50">Already have account?</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
          {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">Loading published plans...</div> : null}
          {!loading && error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm font-bold text-rose-700">{error}</div> : null}
          {!loading && !error && plans.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">No plans are published yet. Please check back soon.</div> : null}
          <div className="grid gap-6 lg:grid-cols-3">{plans.map((plan: any) => <PricingCard key={plan.id || plan.slug} plan={plan} token={token} selected={selectedPlan === plan.slug} />)}</div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 md:px-8">
          <div className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Need help choosing?</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">Message charges are billed separately from wallet balance where applicable. For custom onboarding, talk to sales.</p>
            </div>
            <Link to="/help-center/ticket" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50"><MessageCircle size={18} className="mr-2" />Talk to Sales</Link>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
