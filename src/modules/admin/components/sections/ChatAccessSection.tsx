import { Button } from "@components/ui/Button";

type Props = {
  enabled: boolean;
  busy?: boolean;
  onEnable: () => void;
  onDisable: () => void;
};

export function ChatAccessSection({ enabled, busy, onEnable, onDisable }: Props) {
  return (
    <div className="rounded-[5px] border border-slate-200 p-3">
      <div className="text-xs font-black text-slate-800 mb-2">Chat Access</div>
      <div className="text-[11px] text-slate-500 mb-3">{enabled ? "Enabled" : "Disabled"}</div>
      {enabled ? (
        <Button variant="outline" disabled={busy} onClick={onDisable} className="h-8 px-3">Disable</Button>
      ) : (
        <Button disabled={busy} onClick={onEnable} className="h-8 px-3">Enable</Button>
      )}
    </div>
  );
}
