import { cn } from "@shared/utils/cn";

export type Employee = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: "ACTIVE" | "BLOCKED" | "DISABLED" | "DELETED";
  assignedChatsCount: number;
  lastLoginAt?: string | null;
  lastActivityAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
};

export type ProfileRes = {
  success: boolean;
  employee: Employee;
  metrics: {
    leadsAssigned: { total: number; today: number; last7Days: number };
    leadsOpen?: { total: number };
    leadsClosed?: { total: number };
    conversationsAssigned?: { total: number };
    series?: {
      assignedLast7Days?: { day: string; count: number }[];
      closedLast7Days?: { day: string; count: number }[];
    };
  };
};

export type LeadItem = {
  id: string;
  phone: string;
  status: string;
  assignedAt?: string | null;
  lastInboundAt?: string | null;
  firstInboundAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PagedRes<T> = { success: boolean; items: T[]; total: number; page: number; limit: number };

export type TabKey = "overview" | "leads" | "analytics" | "activities" | "sessions";
export type OwnerTabKey = TabKey | "requests";

export function fmtDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export function StatusBadge({ status }: { status: Employee["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[5px] px-2 py-1 text-[10px] font-black uppercase tracking-widest border",
        status === "ACTIVE"
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : status === "BLOCKED"
            ? "bg-rose-50 text-rose-700 border-rose-100"
            : "bg-slate-50 text-slate-700 border-slate-200"
      )}
    >
      {status}
    </span>
  );
}

export function MiniBarChart({ title, series }: { title: string; series: { day: string; count: number }[] }) {
  const max = Math.max(1, ...series.map((s) => Number(s.count || 0)));
  return (
    <div className="rounded-[5px] border border-slate-200 p-3">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</div>
      <div className="mt-3 grid grid-cols-7 gap-1 items-end h-[64px]">
        {series.map((s) => {
          const h = Math.round((Number(s.count || 0) / max) * 64);
          return (
            <div key={s.day} className="flex flex-col items-center justify-end gap-1">
              <div className="w-full rounded-[4px] bg-slate-900/80" style={{ height: `${Math.max(2, h)}px` }} title={`${s.day}: ${s.count}`} />
              <div className="text-[9px] font-bold text-slate-400">{String(s.day || "").slice(8, 10)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Tabs({ value, onChange }: { value: OwnerTabKey; onChange: (v: OwnerTabKey) => void }) {
  const items: { key: OwnerTabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "leads", label: "Leads" },
    { key: "analytics", label: "Analytics" },
    { key: "activities", label: "Activities" },
    { key: "sessions", label: "Login/Logout" },
    { key: "requests", label: "Requests" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "h-9 px-3 rounded-[5px] border text-[12px] font-black uppercase tracking-widest",
            value === t.key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
