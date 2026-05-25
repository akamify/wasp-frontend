export type Conversation = {
  _id?: string;
  phone: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  contact?: { name?: string; company?: string; tags?: string[] } | null;
  assignedEmployeeId?: string | null;
  leadStatus?: string | null;
  employeeUnreadCount?: number;
  ownerUnreadCount?: number;
};

export function fmtDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export function statusBadge(status?: string | null) {
  const s = String(status || "UNASSIGNED").toUpperCase();
  const map: Record<string, string> = {
    OPEN: "bg-emerald-50 text-emerald-700 border-emerald-100",
    PENDING: "bg-amber-50 text-amber-800 border-amber-100",
    FOLLOW_UP: "bg-blue-50 text-blue-700 border-blue-100",
    WON: "bg-emerald-50 text-emerald-700 border-emerald-100",
    LOST: "bg-rose-50 text-rose-700 border-rose-100",
    REOPENED: "bg-purple-50 text-purple-700 border-purple-100",
    UNASSIGNED: "bg-slate-50 text-slate-700 border-slate-200",
  };
  return map[s] || "bg-slate-50 text-slate-700 border-slate-200";
}

export function isActiveStatus(status?: string | null) {
  const s = String(status || "UNASSIGNED").toUpperCase();
  return s !== "WON" && s !== "LOST";
}
