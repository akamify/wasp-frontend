import { Cloud, FileSpreadsheet, Megaphone } from "lucide-react";

import type { CampaignType } from "@modules/campaigns/types/campaign-form.types";

type CampaignTypeSelectorProps = {
  onSelect: (type: CampaignType) => void;
};

const CAMPAIGN_TYPES = [
  { id: "broadcast" as const, title: "Broadcast", icon: <Megaphone size={22} />, desc: "Select from your contacts and send static messages." },
  { id: "csv" as const, title: "CSV Upload", icon: <FileSpreadsheet size={22} />, desc: "Upload a CSV file with variables for personalized reach." },
  { id: "api" as const, title: "API Driven", icon: <Cloud size={22} />, desc: "Trigger messages via our high-speed developer API." },
];

export function CampaignTypeSelector({ onSelect }: CampaignTypeSelectorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-3">
        {CAMPAIGN_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelect(type.id)}
            className="flex flex-col p-6 cursor-pointer text-left rounded-[5px] border-2 border-ink-900/5 bg-white hover:border-brand-600 hover:shadow-xl hover:shadow-brand-600/5 transition-all group relative overflow-hidden"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[5px] bg-slate-50 text-ink-900 group-hover:bg-brand-600 group-hover:text-white transition-all">
              {type.icon}
            </div>
            <div className="text-base font-black text-ink-900 group-hover:text-brand-600 transition-colors">{type.title}</div>
            <div className="mt-2 text-xs font-medium leading-relaxed text-ink-800/60">{type.desc}</div>
            <div className="mt-6 flex items-center text-[10px] font-black uppercase tracking-widest text-brand-600 opacity-0 group-hover:opacity-100 transition-all">
              Select Type â†’
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
