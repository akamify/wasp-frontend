import { X } from "lucide-react";

type CampaignModalHeaderProps = {
  onClose: () => void;
};

export function CampaignModalHeader({ onClose }: CampaignModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-ink-900/5 bg-slate-50/50 sticky top-0 z-10">
      <div>
        <h2 className="text-xl font-black text-ink-900">Create New Campaign</h2>
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-800/40">Launch your message to the world</p>
      </div>
      <button onClick={onClose} className="p-2 hover:bg-ink-900/5 rounded-[5px] transition-colors" aria-label="Close">
        <X size={20} />
      </button>
    </div>
  );
}
