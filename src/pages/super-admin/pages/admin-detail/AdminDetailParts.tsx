import { Button } from "@components/ui/Button";

export const TABS = [
  { key: "profile", label: "Profile" },
  { key: "analytics", label: "Analytics" },
  { key: "activity", label: "Activity" },
  { key: "login-logout", label: "Login/Logout" },
  { key: "profile-requests", label: "Profile Requests" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

export function ListSection({ title, items, onOpen, onScroll, kind }: { title: string; items: any[]; onOpen: (item: any) => void; onScroll: (e: React.UIEvent<HTMLDivElement>) => void; kind: "activity" | "login" | "request" }) {
  return (
    <div className="rounded-[5px] border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">{title}</div>
      <div className="max-h-[70vh] overflow-auto p-3" onScroll={onScroll}>
        {items.length ? items.map((x) => (
          <button key={String(x._id)} onClick={() => onOpen(x)} className="mb-2 w-full rounded border border-slate-200 p-3 text-left text-xs hover:bg-slate-50">
            <div className="font-bold text-slate-900">{getListTitle(x, kind)}</div>
            <div className="mt-1 text-slate-600">{getListSubTitle(x, kind)}</div>
            <div className="text-slate-600">{x.createdAt ? new Date(x.createdAt).toLocaleString("en-IN") : "-"}</div>
          </button>
        )) : <div className="text-sm text-slate-500">No data.</div>}
      </div>
    </div>
  );
}

export function AnalyticsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-slate-200 p-3">
      <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-900">{value}</div>
    </div>
  );
}

export function ActivityTrendGraph({ items }: { items: any[] }) {
  const now = new Date();
  const days: { key: string; label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({ key, label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), count: 0 });
  }
  const map = new Map(days.map((x) => [x.key, x]));
  (items || []).forEach((e) => {
    const dt = e?.createdAt ? new Date(e.createdAt) : null;
    if (!dt || Number.isNaN(dt.getTime())) return;
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    const row = map.get(key); if (row) row.count += 1;
  });
  const max = Math.max(1, ...days.map((x) => x.count));
  const bars = days.map((x) => ({ ...x, pct: Math.round((x.count / max) * 100) }));

  return (
    <div className="grid grid-cols-7 gap-2 items-end h-36">
      {bars.map((b) => (
        <div key={b.key} className="flex flex-col items-center gap-1">
          <div className="text-[10px] font-bold text-slate-500">{b.count}</div>
          <div className="w-full rounded bg-slate-100 h-24 flex items-end"><div className="w-full rounded bg-brand-500" style={{ height: `${Math.max(6, b.pct)}%` }} /></div>
          <div className="text-[10px] text-slate-500">{b.label}</div>
        </div>
      ))}
    </div>
  );
}

export function SimpleList({ title, items }: { title: string; items: string[] }) {
  const uniq = Array.from(new Set(items || []));
  return (
    <div className="rounded border border-slate-200 p-2">
      <div className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">{title}</div>
      <div className="space-y-1">
        {uniq.map((item) => <div key={item} className="rounded bg-slate-50 px-2 py-1">{item}</div>)}
        {!uniq.length ? <div className="text-xs text-slate-400">No items</div> : null}
      </div>
    </div>
  );
}

export function DetailFields({ detail }: { detail: any }) {
  const rows = [["Action", String(detail?.action || "-")],["Status", String(detail?.status || detail?.metadata?.status || "-")],["Reason", String(detail?.reason || detail?.metadata?.reason || "-")],["Review Note", String(detail?.reviewNote || detail?.metadata?.reviewNote || "-")],["Actor Id", String(detail?.actorId || "-")],["Target Id", String(detail?.targetId || "-")],["Resource Type", String(detail?.resourceType || detail?.metadata?.resourceType || "-")],["Resource Id", String(detail?.resourceId || detail?.metadata?.resourceId || "-")],["IP", String(detail?.ip || "-")],["Location", String(detail?.location || "-")],["User Agent", String(detail?.userAgent || "-")],["Created At", detail?.createdAt ? new Date(detail.createdAt).toLocaleString("en-IN") : "-"],["Updated At", detail?.updatedAt ? new Date(detail.updatedAt).toLocaleString("en-IN") : "-"]];
  const requestedChangesObj = detail?.requestedChanges && typeof detail.requestedChanges === "object" ? detail.requestedChanges : detail?.metadata?.requestedChanges && typeof detail.metadata.requestedChanges === "object" ? detail.metadata.requestedChanges : null;
  const requestedChanges = requestedChangesObj ? Object.entries(requestedChangesObj).map(([k, v]) => `${k}: ${String(v || "")}`).filter(Boolean).join(", ") : "";
  const requestType = String(detail?.metadata?.requestType || "").trim();
  const requestTypeLabel = requestType === "name" ? "Name Change" : requestType === "email" ? "Email Change" : requestType === "phone" ? "Phone Change" : requestType === "password_reset" ? "Password Reset Link" : requestType === "2fa_enable" ? "Enable 2FA" : requestType === "2fa_disable" ? "Disable 2FA" : "";

  return (
    <div className="space-y-2">
      {rows.map(([k, v]) => (<div key={k} className="grid grid-cols-[160px_1fr] gap-3 border-b border-slate-100 pb-2"><div className="font-black text-slate-500">{k}</div><div className="break-all text-slate-800">{v}</div></div>))}
      {requestedChanges ? <div className="grid grid-cols-[160px_1fr] gap-3 border-b border-slate-100 pb-2"><div className="font-black text-slate-500">Requested Changes</div><div className="break-all text-slate-800">{requestedChanges}</div></div> : null}
      {requestTypeLabel ? <div className="grid grid-cols-[160px_1fr] gap-3 border-b border-slate-100 pb-2"><div className="font-black text-slate-500">Request Type</div><div className="break-all text-slate-800">{requestTypeLabel}</div></div> : null}
    </div>
  );
}

export function getListTitle(item: any, kind: "activity" | "login" | "request") {
  if (kind === "login") {
    if (item?.action === "auth.login.success") return "Login Success";
    if (item?.action === "auth.logout") return "Manual Logout";
    if (item?.action === "auth.force_logout") return "Forced Logout";
  }
  if (kind !== "request") return item?.action || "event";
  const reqType = String(item?.metadata?.requestType || "").trim();
  if (!reqType) return item?.action || "profile request";
  const map: Record<string, string> = { name: "Name Change Request", email: "Email Change Request", phone: "Phone Change Request", password_reset: "Password Reset Link Request", "2fa_enable": "Enable 2FA Request", "2fa_disable": "Disable 2FA Request" };
  return map[reqType] || `Request: ${reqType}`;
}

export function getListSubTitle(item: any, kind: "activity" | "login" | "request") {
  if (kind !== "request") return "";
  const status = String(item?.metadata?.status || "pending");
  const reason = String(item?.metadata?.reason || "").trim();
  return `Status: ${status}${reason ? ` | Reason: ${reason}` : ""}`;
}
