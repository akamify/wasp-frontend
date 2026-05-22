import { Check, ArrowRight } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { cn } from "@shared/utils/cn";
import { usePlans } from "@modules/billing/hooks/usePlans";

function formatPlanPrice(plan: any) {
  const paise = plan?.pricing?.discountedPricePaise;
  if (paise == null) return "Custom";
  return `₹${Math.round(Number(paise) / 100).toLocaleString("en-IN")}`;
}

export default function PricingPage() {
  const { items } = usePlans();
  const plans = Array.isArray(items) ? items : [];

  return (
    <div className="max-w-7xl mx-auto space-y-12 p-4 md:p-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tight text-slate-900">Choose Your Plan</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {plans.map((plan: any) => (
          <Card
            key={plan.id}
            className={cn(
              "p-8 border-none shadow-xl flex flex-col relative overflow-hidden transition-all hover:scale-[1.02] duration-300 rounded-[5px]",
              plan?.ui?.recommended ? "ring-2 ring-brand-600 shadow-brand-500/10" : "shadow-slate-200/50"
            )}
          >
            <h3 className="text-2xl font-black text-slate-900">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-black text-slate-900">{formatPlanPrice(plan)}</span>
              <span className="text-slate-400 font-bold text-sm">{plan.planType === "custom" ? "" : "/month"}</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">+ GST (as applicable)</p>
            <p className="mt-4 text-slate-500 text-sm font-medium leading-relaxed">{plan.description}</p>

            <div className="my-8 h-px bg-slate-50" />

            <ul className="space-y-4 mb-8 flex-1">
              {(Array.isArray(plan.displayFeatures) ? plan.displayFeatures : []).slice(0, 6).map((feature: string) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="bg-emerald-50 text-emerald-600 p-1 rounded-[5px] shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Button className="w-full h-14 rounded-[5px] font-black transition-all group bg-brand-600 hover:bg-brand-700 text-white">
              {plan?.ui?.buttonText || "Buy Now"}
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Card>
        ))}
      </div>

      <div className="bg-white rounded-[5px] p-4 border border-slate-100 shadow-sm text-xs font-semibold text-slate-600">
        WhatsApp/message charges are billed separately from wallet balance where applicable.
      </div>
    </div>
  );
}
