import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

import type { CampaignEstimate, CampaignTierInfo, CampaignWalletBalance } from "@modules/campaigns/types/campaign-form.types";
import { formatCurrency } from "@modules/campaigns/utils/campaignFormatters";

type CampaignMetricsBarProps = {
  limitsLoading: boolean;
  tierInfo: CampaignTierInfo;
  audienceCount: number;
  estimateLoading: boolean;
  estimate: CampaignEstimate | null;
  walletBalance: CampaignWalletBalance | null;
};

export function CampaignMetricsBar({
  limitsLoading,
  tierInfo,
  audienceCount,
  estimateLoading,
  estimate,
  walletBalance,
}: CampaignMetricsBarProps) {
  return (
    <div className="rounded-[5px] border border-ink-900/5 bg-slate-50/50 px-6 py-5">
      <div className="grid gap-6 sm:grid-cols-5">
        <Metric label="Messaging Tier" value={limitsLoading ? <span className="animate-pulse opacity-50">...</span> : tierInfo?.tierLabel || "-"} hint={tierInfo?.limitPer24h ? `(${tierInfo.limitPer24h.toLocaleString()} / 24h)` : "Limit unknown"} />
        <Metric label="Remaining" value={limitsLoading ? "-" : tierInfo?.remainingQuota ? tierInfo.remainingQuota.toLocaleString() : "-"} hint="approx. quota" />
        <Metric label="Audience" value={audienceCount.toLocaleString()} hint="recipients" />
        <Metric label="Est. Credits" value={estimateLoading ? <span className="animate-pulse opacity-50">...</span> : estimate ? formatCurrency(estimate.estimatedCredits, estimate.currency) : "-"} hint={estimate ? `${estimate.billableRecipients} billable` : ""} />
        <Metric
          label="Your Balance"
          value={walletBalance ? formatCurrency(walletBalance.amount, walletBalance.currency) : "-"}
          hint={estimate?.insufficientBalance ? "Insufficient Funds" : walletBalance ? "" : ""}
          hintClassName={estimate?.insufficientBalance ? "text-rose-600" : "text-emerald-600"}
        />
      </div>
      {estimate?.insufficientBalance ? (
        <div className="mt-4 flex items-center gap-3 rounded-[5px] border border-rose-200 bg-rose-50 px-4 py-3">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <div className="text-xs font-bold text-rose-700">
            Insufficient balance for this campaign. Please recharge your wallet to continue.
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  hintClassName = "text-ink-800/60",
}: {
  label: string;
  value: ReactNode;
  hint: ReactNode;
  hintClassName?: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-widest text-ink-800/40">{label}</div>
      <div className="mt-1.5 text-sm font-black text-ink-900">{value}</div>
      <div className={`mt-0.5 text-[10px] font-bold ${hintClassName}`}>{hint}</div>
    </div>
  );
}
