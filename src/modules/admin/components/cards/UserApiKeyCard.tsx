import { Button } from "@components/ui/Button";
import type { UserApiKey } from "@modules/admin/types/api-key.types";

type Props = {
  item: UserApiKey;
  onDisable: (keyId: string) => void;
  onEnable: (keyId: string) => void;
  busy?: boolean;
};

export function UserApiKeyCard({ item, onDisable, onEnable, busy }: Props) {
  const active = !item.revoked && item.status !== "disabled";
  const chatAccess = Boolean(item.permissions?.chatAccess);
  return (
    <div className="rounded-[5px] border border-slate-200 p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black text-slate-900">{item.name}</div>
          <div className="text-[11px] text-slate-500">Created: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}</div>
          <div className="text-[11px] text-slate-500">Last used: {item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleString() : "N/A"}</div>
        </div>
        {!active ? (
          <Button disabled={busy} onClick={() => onEnable(item.id)} className="h-8 px-3">Enable Key</Button>
        ) : (
          <Button disabled={busy} variant="outline" onClick={() => onDisable(item.id)} className="h-8 px-3">Disable Key</Button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 text-[11px]">
        <div className="rounded-[5px] bg-slate-50 px-3 py-2 flex items-center justify-between gap-3">
          <div>
            <div className="font-black text-slate-700">campaignSend</div>
            <div className="text-slate-500">{item.permissions?.campaignSend ? "enabled" : "disabled"}</div>
          </div>
        </div>
        <div className="rounded-[5px] bg-slate-50 px-3 py-2 flex items-center justify-between gap-3">
          <div>
            <div className="font-black text-slate-700">External Chat API</div>
            <div className="text-slate-500">{chatAccess ? "enabled by workspace access" : "disabled"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
