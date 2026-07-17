import type { UserApiKey } from "@modules/admin/types/api-key.types";
import { UserApiKeyCard } from "@modules/admin/components/cards/UserApiKeyCard";

type Props = {
  apiKeys: UserApiKey[];
  busy?: boolean;
  onDisable: (keyId: string) => void;
  onEnable: (keyId: string) => void;
  hideKeys?: boolean;
  onDisableMany?: (keyIds: string[]) => void;
};

export function ApiKeyListSection({ apiKeys, busy, onDisable, onEnable, hideKeys, onDisableMany }: Props) {
  const activeKeys = apiKeys.filter((key) => !key.revoked && key.status !== "disabled");
  if (hideKeys) {
    return (
      <div className="rounded-[5px] border border-slate-200 p-3">
        <div className="text-xs font-black text-slate-800">API Keys</div>
        <div className="mt-1 text-[11px] text-slate-500">
          {activeKeys.length ? `${activeKeys.length} active key(s). Key details are hidden.` : "No active API keys."}
        </div>
        {activeKeys.length ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onDisableMany ? onDisableMany(activeKeys.map((key) => key.id)) : activeKeys.forEach((key) => onDisable(key.id))}
            className="mt-3 h-8 rounded-[5px] border border-slate-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-700 disabled:opacity-50"
          >
            Disable active keys
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {apiKeys.map((k) => (
        <UserApiKeyCard
          key={k.id}
          item={k}
          busy={busy}
          onDisable={onDisable}
          onEnable={onEnable}
        />
      ))}
      {!apiKeys.length ? <div className="text-[11px] text-slate-500">No API keys</div> : null}
    </div>
  );
}
