import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

type UsageCard = { key: string; label: string; data: any };

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  usageCards: UsageCard[];
  details: any;
};

export function CurrentPlanModal({ open, onClose, title, usageCards, details }: Props) {
  const enabledFeatures = Object.entries(details?.subscription?.features || details?.effective?.features || {})
    .filter(([, enabled]) => Boolean(enabled))
    .map(([key]) => key.replace(/Access$/, "").replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()));

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-5xl overflow-hidden rounded-[5px] border border-slate-100 bg-white shadow-2xl"
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-brand-600">Current Plan</div>
                <h2 className="mt-1 text-lg font-black text-slate-900">{title}</h2>
              </div>
              <button onClick={onClose} className="rounded-[5px] p-2 text-slate-400 transition-colors hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-4">
                {usageCards.map((card) => (
                  <div key={card.key} className="rounded-[5px] border border-slate-200 p-3">
                    <div className="text-xs font-black uppercase tracking-wider text-slate-500">{card.label}</div>
                    <div className="mt-2 text-xl font-black text-slate-900">
                      {Number(card?.data?.used || 0)}{card?.data?.limit == null ? " / ∞" : ` / ${card.data.limit}`}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">Remaining: {card?.data?.remaining == null ? "Unlimited" : card.data.remaining}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[5px] border border-slate-200 p-4">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-500">Validity</div>
                  <div className="mt-2 text-sm font-semibold text-slate-800">
                    Start: {details?.subscription?.currentPeriodStart ? new Date(details.subscription.currentPeriodStart).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-"}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">
                    End: {details?.subscription?.currentPeriodEnd ? new Date(details.subscription.currentPeriodEnd).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-"}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">Status: {details?.subscription?.status || "-"}</div>
                </div>
                <div className="rounded-[5px] border border-slate-200 p-4">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-500">Enabled Features</div>
                  <div className="mt-3 flex max-h-52 flex-wrap gap-2 overflow-y-auto">
                    {enabledFeatures.slice(0, 24).map((feature) => <span key={feature} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{feature}</span>)}
                    {!enabledFeatures.length ? <div className="text-sm font-semibold text-slate-500">No advanced features enabled.</div> : null}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
