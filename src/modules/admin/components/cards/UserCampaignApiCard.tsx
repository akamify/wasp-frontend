import type { UserApiKey } from "@modules/admin/types/api-key.types";

type Props = {
  enabled: boolean;
  busy?: boolean;
  onEnable: () => void;
  onDisable: () => void;
};

export function UserCampaignApiCard({ enabled, busy, onEnable, onDisable }: Props) {
  return (
    <div className="rounded-[5px] border border-slate-200 p-3 text-[11px] space-y-3">
      <div className="font-black text-slate-700 mb-1">Campaign API</div>
      <div className="rounded-[5px] bg-slate-50 px-3 py-2 flex items-center justify-between gap-3">
        <div>
          <div className="font-black text-slate-700">Campaign API Access</div>
          <div className="text-slate-500">{enabled ? "enabled" : "disabled"}</div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={enabled ? onDisable : onEnable}
          className="h-8 rounded-[5px] border border-slate-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-700 disabled:opacity-50"
        >
          {enabled ? "Disable" : "Enable"}
        </button>
      </div>
    </div>
  );
}
