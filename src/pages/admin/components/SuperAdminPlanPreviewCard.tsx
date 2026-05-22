import { Check, X } from "lucide-react";
import { cn } from "@shared/utils/cn";

type Props = {
  name?: string;
  description?: string;
  discountedPriceRupees?: string;
  recommended?: boolean;
  badgeText?: string;
  discountAmountPaise?: number;
  displayFeatures?: string[];
  unavailableFeatures?: string[];
};

export function SuperAdminPlanPreviewCard(props: Props) {
  const displayFeatures = Array.isArray(props.displayFeatures) ? props.displayFeatures : [];
  const unavailableFeatures = Array.isArray(props.unavailableFeatures) ? props.unavailableFeatures : [];
  const price =
    props.discountedPriceRupees && String(props.discountedPriceRupees).trim()
      ? `₹${Number(props.discountedPriceRupees).toLocaleString("en-IN")}`
      : "Custom";
  const saveText =
    props.badgeText ||
    (Number(props.discountAmountPaise || 0) > 0
      ? `Save ₹${Math.round(Number(props.discountAmountPaise || 0) / 100).toLocaleString("en-IN")}`
      : "");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[5px] border transition-all",
        props.recommended
          ? "border-brand-400 bg-brand-50/50 shadow-xl shadow-brand-500/10"
          : "border-slate-200 bg-white shadow-sm"
      )}
    >
      {props.recommended ? (
        <div className="absolute top-0 left-0 right-0 bg-brand-600 text-white text-xs font-black uppercase tracking-wider py-1 text-center">
          Recommended
        </div>
      ) : null}

      <div className={cn("p-6", props.recommended && "pt-12")}>
        <h3 className="text-lg font-black text-slate-900">{props.name || "Plan"}</h3>
        <p className="mt-1 text-xs font-semibold text-slate-500">{props.description || "No description"}</p>

        <div className="mt-6 flex items-baseline gap-1">
          <span className="text-4xl font-black text-slate-900">{price}</span>
          <span className="text-sm font-semibold text-slate-500">+ GST</span>
        </div>

        {saveText ? (
          <div className="mt-3 inline-block rounded-[3px] bg-brand-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-700">
            {saveText}
          </div>
        ) : null}

        <div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">Includes:</p>
          {displayFeatures.length ? (
            displayFeatures.map((feature, i) => (
              <div key={`${feature}-${i}`} className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-700">{feature}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500">No included features</div>
          )}

          {unavailableFeatures.length ? (
            <>
              <p className="pt-3 text-xs font-black uppercase tracking-wider text-slate-400">Not included:</p>
              {unavailableFeatures.map((feature, i) => (
                <div key={`${feature}-${i}`} className="flex items-start gap-2 opacity-50">
                  <X size={16} className="mt-0.5 shrink-0 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-500">{feature}</span>
                </div>
              ))}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

