import { Check, X } from "lucide-react";
import { formatCurrencyFromPaise, formatCurrencySafe } from "@shared/config/currency";
import { cn } from "@shared/utils/cn";

type Props = {
  name?: string;
  description?: string;
  discountedPriceRupees?: string;
  recommended?: boolean;
  badgeText?: string;
  badgeType?: string;
  cardColor?: string;
  icon?: string;
  billingCycle?: string;
  buttonText?: string;
  discountAmountPaise?: number;
  displayFeatures?: string[];
  unavailableFeatures?: string[];
  addonServices?: string[];
  limits?: Record<string, any>;
};

export function SuperAdminPlanPreviewCard(props: Props) {
  const displayFeatures = Array.isArray(props.displayFeatures) ? props.displayFeatures : [];
  const unavailableFeatures = Array.isArray(props.unavailableFeatures) ? props.unavailableFeatures : [];
  const addonServices = Array.isArray(props.addonServices) ? props.addonServices : [];
  const cardColor = props.cardColor || "slate";
  const colorMap: Record<string, string> = {
    blue: "border-blue-300 bg-blue-50/50 shadow-blue-500/10",
    green: "border-emerald-300 bg-emerald-50/50 shadow-emerald-500/10",
    purple: "border-purple-300 bg-purple-50/50 shadow-purple-500/10",
    gold: "border-amber-300 bg-amber-50/50 shadow-amber-500/10",
    slate: "border-slate-200 bg-white shadow-slate-500/5",
  };
  const accentMap: Record<string, string> = {
    blue: "bg-blue-600",
    green: "bg-emerald-600",
    purple: "bg-purple-600",
    gold: "bg-amber-500",
    slate: "bg-slate-900",
  };
  const price = props.discountedPriceRupees && String(props.discountedPriceRupees).trim() ? formatCurrencySafe(Number(props.discountedPriceRupees), "INR") : "Custom";
  const cycle = props.billingCycle && props.billingCycle !== "lifetime" ? `/${props.billingCycle}` : props.billingCycle === "lifetime" ? " lifetime" : "";
  const saveText = props.badgeText || (Number(props.discountAmountPaise || 0) > 0 ? `Save ${formatCurrencyFromPaise(props.discountAmountPaise || 0, "INR")}` : "");
  const limitChips = [
    props.limits?.messageRatePerSec ? `${props.limits.messageRatePerSec}/sec` : "",
    props.limits?.maxAgents ? `${props.limits.maxAgents} agents` : "",
    props.limits?.maxTags ? `${props.limits.maxTags} tags` : "",
    props.limits?.maxCustomAttributes ? `${props.limits.maxCustomAttributes} attrs` : "",
    props.limits?.maxWebhooks ? `${props.limits.maxWebhooks} webhooks` : "",
  ].filter(Boolean);

  return (
    <div className={cn("relative overflow-hidden rounded-[5px] border shadow-xl transition-all", props.recommended ? "border-brand-400 bg-brand-50/50 shadow-brand-500/10" : colorMap[cardColor])}>
      {props.recommended ? <div className="absolute left-0 right-0 top-0 bg-brand-600 py-1 text-center text-xs font-black uppercase tracking-wider text-white">Recommended</div> : null}
      <div className={cn("p-6", props.recommended && "pt-12")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-900">{props.name || "Plan"}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{props.badgeType && props.badgeType !== "none" ? props.badgeType.replace(/_/g, " ") : "Subscription"}</p>
          </div>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-[5px] text-lg font-black text-white", accentMap[cardColor])}>{props.icon || "⭐"}</div>
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-500">{props.description || "No description"}</p>
        <div className="mt-6 flex items-baseline gap-1"><span className="text-4xl font-black text-slate-900">{price}</span><span className="text-sm font-semibold text-slate-500">{cycle} + GST</span></div>
        {saveText ? <div className="mt-3 inline-block rounded-[3px] bg-brand-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-700">{saveText}</div> : null}
        {limitChips.length ? <div className="mt-4 flex flex-wrap gap-2">{limitChips.map((chip) => <span key={chip} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">{chip}</span>)}</div> : null}
        <div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">Includes:</p>
          {displayFeatures.length ? displayFeatures.map((feature, i) => <div key={`${feature}-${i}`} className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" /><span className="text-sm font-semibold text-slate-700">{feature}</span></div>) : <div className="text-xs text-slate-500">No included features</div>}
          {unavailableFeatures.length ? <><p className="pt-3 text-xs font-black uppercase tracking-wider text-slate-400">Not included:</p>{unavailableFeatures.map((feature, i) => <div key={`${feature}-${i}`} className="flex items-start gap-2 opacity-50"><X size={16} className="mt-0.5 shrink-0 text-slate-400" /><span className="text-sm font-semibold text-slate-500">{feature}</span></div>)}</> : null}
          {addonServices.length ? <><p className="pt-3 text-xs font-black uppercase tracking-wider text-brand-600">Add-on services:</p>{addonServices.map((service, i) => <div key={`${service}-${i}`} className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand-600" /><span className="text-sm font-semibold text-slate-700">{service}</span></div>)}</> : null}
        </div>
        <button className={cn("mt-6 w-full rounded-[5px] px-4 py-3 text-sm font-black text-white", accentMap[cardColor])}>{props.buttonText || "Buy Now"}</button>
      </div>
    </div>
  );
}
