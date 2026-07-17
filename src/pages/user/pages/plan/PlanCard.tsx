import { Check, Phone, ArrowRight, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@shared/utils/cn";
import { Button } from "@components/ui/Button";

type Plan = {
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
  actionLabel?: string;
  actionDisabled?: boolean;
  actionHint?: string;
  scheduleBadge?: string;
  scheduleBadgeTone?: "current" | "scheduled";
};

type Props = {
  plan: Plan;
  horizontal?: boolean;
  paymentProcessing: boolean;
  onCurrentPlanClick: () => void;
  onActionClick: (plan: any) => void;
};

export function PlanCard({ plan, horizontal = false, paymentProcessing, onCurrentPlanClick, onActionClick }: Props) {
  const isFreePlan = plan.slug === "free";
  const showRecommendedStyle = plan.recommended && !isFreePlan;

  return (
    <motion.div
      layout
      className={cn(
        "relative overflow-hidden rounded-[5px] border transition-all",
        horizontal ? "md:col-span-3" : "",
        showRecommendedStyle
          ? "border-brand-500 bg-gradient-to-br from-brand-50 to-white shadow-2xl shadow-brand-500/20 md:scale-[1.04]"
          : "border-slate-200 bg-white shadow-sm",
        plan.isCurrentPlan && "ring-2 ring-brand-600",
        isFreePlan && "border-slate-200 bg-white"
      )}
    >
      {showRecommendedStyle ? (
        <div className="absolute left-0 right-0 top-0 bg-brand-600 py-1.5 text-center text-xs font-black uppercase tracking-wider text-white">
          Recommended
        </div>
      ) : null}

      <div className={cn("p-6", showRecommendedStyle && "pt-12", horizontal && "md:grid md:grid-cols-[1.05fr_1fr] md:items-start md:gap-8")}>
        <div>
          <h3 className={cn("font-black text-slate-900", showRecommendedStyle ? "text-2xl" : "text-lg")}>{plan.name}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">{plan.description}</p>

          <div className="mt-6 flex items-baseline gap-1">
            <span className={cn("font-black text-slate-900", showRecommendedStyle ? "text-5xl" : "text-4xl")}>{plan.price}</span>
            {plan.period ? <span className="text-sm font-semibold text-slate-500">{plan.period}</span> : null}
          </div>

          {plan.isCurrentPlan ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="inline-block rounded-[3px] bg-brand-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-700">🟢 Current Plan</div>
              {plan.scheduleBadge ? (
                <div className="inline-block rounded-[3px] bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
                  🟡 {plan.scheduleBadge}
                </div>
              ) : null}
            </div>
          ) : null}

          {!plan.isCurrentPlan && plan.scheduleBadge ? (
            <div className="mt-4 inline-block rounded-[3px] bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
              ⏳ {plan.scheduleBadge}
            </div>
          ) : null}

          <Button
            onClick={() => (plan.isCurrentPlan ? onCurrentPlanClick() : onActionClick(plan))}
            className={cn("mt-6 w-full gap-2", !plan.isCurrentPlan && plan.planType !== "basic" && "bg-brand-600 hover:bg-brand-700")}
            variant={plan.isCurrentPlan ? "outline" : "primary"}
            disabled={Boolean(plan.actionDisabled) || (!plan.isCurrentPlan && plan.planType !== "custom" && paymentProcessing)}
          >
            {plan.isCurrentPlan ? (
              "View Now"
            ) : plan.planType === "custom" ? (
              <><Phone size={16} /> {plan.cta}</>
            ) : paymentProcessing ? (
              "Processing..."
            ) : (
              <>{plan.actionLabel || plan.cta} <ArrowRight size={16} /></>
            )}
          </Button>
          {plan.actionHint ? <p className="mt-2 text-center text-[11px] font-semibold text-slate-500">{plan.actionHint}</p> : null}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6 md:mt-0 md:border-t-0 md:pt-0">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">Includes:</p>
          <div className={cn("mt-3", horizontal ? "grid gap-2 md:grid-cols-2" : "space-y-3")}>
            {plan.features.map((feature, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-700">{feature}</span>
              </div>
            ))}
          </div>

          {plan.notIncluded.length > 0 ? (
            <>
              <p className="pt-3 text-xs font-black uppercase tracking-wider text-slate-400">Not included:</p>
              <div className={cn("mt-2", horizontal ? "grid gap-2 md:grid-cols-2" : "space-y-3")}>
                {plan.notIncluded.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 opacity-50">
                    <X size={16} className="mt-0.5 shrink-0 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-500">{feature}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
