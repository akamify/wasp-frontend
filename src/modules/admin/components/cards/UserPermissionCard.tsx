type Props = {
  campaignSend: boolean;
  chatAccess: boolean;
  busy?: boolean;
  onEnableCampaignSend?: () => void;
  onDisableCampaignSend?: () => void;
  onEnableChat?: () => void;
  onDisableChat?: () => void;
  readOnly?: boolean;
};

export function UserPermissionCard({
  campaignSend,
  chatAccess,
  busy,
  onEnableCampaignSend,
  onDisableCampaignSend,
  onEnableChat,
  onDisableChat,
  readOnly,
}: Props) {
  return (
    <div className="rounded-[5px] border border-slate-200 p-3 text-[11px] space-y-3">
      <div className="font-black text-slate-700 mb-1">Workspace API Permissions</div>
      <PermissionRow
        label="Campaign API Access (Workspace)"
        enabled={campaignSend}
        busy={busy}
        onEnable={onEnableCampaignSend}
        onDisable={onDisableCampaignSend}
        readOnly={readOnly}
      />
      <PermissionRow
        label="Chat API Access (Workspace)"
        enabled={chatAccess}
        busy={busy}
        onEnable={onEnableChat}
        onDisable={onDisableChat}
        readOnly={readOnly}
      />
    </div>
  );
}

function PermissionRow({
  label,
  enabled,
  busy,
  onEnable,
  onDisable,
  readOnly,
}: {
  label: string;
  enabled: boolean;
  busy?: boolean;
  onEnable?: () => void;
  onDisable?: () => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[5px] bg-slate-50 px-3 py-2">
      <div>
        <div className="font-black text-slate-700">{label}</div>
        <div className="text-slate-500">{enabled ? "enabled" : "disabled"}</div>
      </div>
      {readOnly ? null : (
        <button
          type="button"
          disabled={busy || !onEnable || !onDisable}
          onClick={enabled ? onDisable : onEnable}
          className="h-8 rounded-[5px] border border-slate-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-700 disabled:opacity-50"
        >
          {enabled ? "Disable" : "Enable"}
        </button>
      )}
    </div>
  );
}
