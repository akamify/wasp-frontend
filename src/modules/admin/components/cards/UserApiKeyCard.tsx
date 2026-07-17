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
    </div>
  );
}
