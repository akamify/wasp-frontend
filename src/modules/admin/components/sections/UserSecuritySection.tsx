import { Button } from "@components/ui/Button";

type Props = {
  blocked: boolean;
  busy?: boolean;
  onBlock: () => void;
  onUnblock: () => void;
};

export function UserSecuritySection({ blocked, busy, onBlock, onUnblock }: Props) {
  return (
    <div className="rounded-[5px] border border-slate-200 p-3">
      <div className="text-xs font-black text-slate-800 mb-2">User Security</div>
      <div className="text-[11px] text-slate-500 mb-3">Account: {blocked ? "Blocked" : "Active"}</div>
      {blocked ? (
        <Button disabled={busy} onClick={onUnblock} className="h-8 px-3">Unblock User</Button>
      ) : (
        <Button variant="outline" disabled={busy} onClick={onBlock} className="h-8 px-3">Block User</Button>
      )}
    </div>
  );
}
