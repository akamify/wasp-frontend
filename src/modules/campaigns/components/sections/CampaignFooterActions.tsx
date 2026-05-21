import { Button } from "@components/ui/Button";
import type { CampaignEstimate, CampaignType } from "@modules/campaigns/types/campaign-form.types";

type CampaignFooterActionsProps = {
  busy: boolean;
  type: CampaignType | null;
  name: string;
  templateId: string;
  estimate: CampaignEstimate | null;
  estimateLoading: boolean;
  onClose: () => void;
  onCreate: () => void;
};

export function CampaignFooterActions({
  busy,
  type,
  name,
  templateId,
  estimate,
  estimateLoading,
  onClose,
  onCreate,
}: CampaignFooterActionsProps) {
  return (
    <div className="p-6 border-t border-ink-900/5 bg-slate-50/50 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-ink-800/40">Ready to Launch</span>
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onClose} className="rounded-[5px]">Cancel</Button>
        <Button
          onClick={onCreate}
          disabled={busy || !type || !name.trim() || !templateId || (type !== "api" && (!!estimate?.insufficientBalance || estimateLoading))}
          className="bg-brand-600 text-white border-brand-600 rounded-[5px] px-8"
        >
          {busy ? "Creating..." : "Create Campaign"}
        </Button>
      </div>
    </div>
  );
}
