import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Alert } from "@components/ui/Alert";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Select } from "@components/ui/Select";
import { cn } from "@shared/utils/cn";
import { MessageSquare, Search, RefreshCw, Tag } from "lucide-react";
import { CrmSectionNav } from "@modules/crm/components/CrmSectionNav";
import { AssignLeadModal } from "@modules/crm/components/AssignLeadModal";
import { useToast } from "@shared/providers/ToastContext";

type Conversation = {
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

type ConversationsRes = { success: boolean; conversations: Conversation[] };

function fmtDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function statusBadge(status?: string | null) {
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

export default function CrmLeadsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Conversation[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [assignPhone, setAssignPhone] = useState<string | null>(null);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [multiSelected, setMultiSelected] = useState<Record<string, boolean>>({});
  const [filterKey, setFilterKey] = useState<"active" | "assigned" | "unassigned">("active");
  const [sortKey, setSortKey] = useState<"last_message" | "status">("last_message");

  const statusOrder = useMemo(() => {
    const order = ["OPEN", "PENDING", "FOLLOW_UP", "REOPENED", "UNASSIGNED", "WON", "LOST"];
    const map = new Map<string, number>();
    order.forEach((s, i) => map.set(s, i));
    return map;
  }, []);

  function isActiveStatus(status?: string | null) {
    const s = String(status || "UNASSIGNED").toUpperCase();
    return s !== "WON" && s !== "LOST";
  }

  function reload() {
    setLoading(true);
    setError(null);
    Promise.all([API.conversations.list({ limit: 200 }), API.crm.employees()])
      .then(([res, empRes]: any[]) => {
        setItems(Array.isArray(res?.conversations) ? res.conversations : []);
        setEmployees(Array.isArray(empRes?.items) ? empRes.items : Array.isArray(empRes) ? empRes : []);
      })
      .catch((e: any) => setError(e?.response?.data?.message || "Failed to load leads"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leads = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    const filtered = (items || []).filter((c) => {
      // We treat any conversation with a leadStatus or an assignee as a CRM lead row.
      const isLead = !!c.leadStatus || !!c.assignedEmployeeId;
      if (!isLead) return false;

      if (filterKey === "assigned" && !c.assignedEmployeeId) return false;
      if (filterKey === "unassigned" && !!c.assignedEmployeeId) return false;
      if (filterKey === "active" && !isActiveStatus(c.leadStatus)) return false;

      if (!q) return true;
      const hay = [c.phone, c.lastMessagePreview, c.contact?.name, c.contact?.company].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });


    return filtered.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
  }, [filterKey, isActiveStatus, items, search, sortKey, statusOrder]);

  const selectedPhones = useMemo(
    () => Object.keys(multiSelected || {}).filter((p) => multiSelected[p]),
    [multiSelected]
  );
  const selectedCount = selectedPhones.length;
  const someSelected = selectedCount > 0;
  const allSelected = leads.length > 0 && leads.every((c) => !!multiSelected[c.phone]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">CRM</div>
          <h1 className="mt-1 text-3xl md:text-4xl font-black tracking-tighter text-slate-900">Leads</h1>
          <p className="mt-2 text-slate-500 font-medium">Workspace conversations with CRM lead status + assignment.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" disabled={loading} onClick={reload} className="gap-2">
            <RefreshCw size={16} /> Refresh
          </Button>
          <Link to="/app/conversations">
            <Button className="gap-2">
              <MessageSquare size={16} /> Inbox
            </Button>
          </Link>
        </div>
      </div>

      <CrmSectionNav />

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 border-slate-200 shadow-sm rounded-[5px] md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[5px] bg-slate-50 text-slate-700">
              <Search size={18} />
            </div>
            <div className="flex-1">
              <Input
                label="Search by phone / name / company"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </Card>
        <Card className="p-4 border-slate-200 shadow-sm rounded-[5px]">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lead rows</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{loading ? "..." : leads.length}</div>
          <div className="mt-1 text-xs text-slate-500 font-medium">Showing assigned/statused conversations.</div>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-[5px] overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-sm font-black text-slate-900">Leads</div>
            <div className="hidden md:block text-[11px] font-semibold text-slate-500">{loading ? "Loading..." : `${leads.length} records`}</div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex bg-slate-100 rounded-[5px] p-1 w-full md:w-auto">
              {[
                { key: "active", label: "Active" },
                { key: "assigned", label: "Assigned" },
                { key: "unassigned", label: "Unassigned" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilterKey(f.key as any)}
                  className={cn(
                    "flex-1 md:flex-none px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[5px] transition-all",
                    filterKey === f.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="md:hidden text-[11px] font-semibold text-slate-500">
              {loading ? "Loading..." : `${leads.length} records`}
            </div>
          </div>
        </div>

        {someSelected ? (
          <div className="bg-brand-50 border-y border-brand-100 px-4 py-3 flex items-center justify-between">
            <div className="text-sm font-bold text-brand-700">{selectedCount} leads selected</div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={() => setBulkAssignOpen(true)}
                disabled={loading}
              >
                Assign Selected
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => setMultiSelected({})}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-[950px] w-full text-[12px]">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                <th className="w-12 px-4 py-3 font-black uppercase tracking-widest text-[10px]">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => {
                      const next: Record<string, boolean> = { ...(multiSelected || {}) };
                      if (e.target.checked) leads.forEach((c) => (next[c.phone] = true));
                      else leads.forEach((c) => delete next[c.phone]);
                      setMultiSelected(next);
                    }}
                    className="rounded-[3px] border-ink-900/20"
                  />
                </th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Lead</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Tags</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Status</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Unread</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Last message</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Preview</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((c) => (
                <tr key={c.phone} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={!!multiSelected[c.phone]}
                      onChange={() => setMultiSelected((p) => ({ ...(p || {}), [c.phone]: !p?.[c.phone] }))}
                      className="rounded-[3px] border-ink-900/20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-black text-slate-900">{c.contact?.name || c.phone}</div>
                    <div className="text-[11px] text-slate-500 font-semibold">
                      {c.contact?.company ? c.contact.company : c.phone}
                    </div>
                  </td>
                  <td>
                    {Array.isArray(c.contact?.tags) && c.contact!.tags!.length ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.contact!.tags!.slice(0, 3).map((t) => (
                          <span key={t} className="inline-flex items-center gap-1 rounded-[5px] border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-700">
                            <Tag size={12} /> {t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center rounded-[5px] px-2 py-1 text-[10px] font-black uppercase tracking-widest border", statusBadge(c.leadStatus))}>
                      {String(c.leadStatus || "UNASSIGNED")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="mt-2 text-slate-900 font-black">{Number(c.employeeUnreadCount || 0)}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-semibold">{fmtDate(c.lastMessageAt)}</td>
                  <td className="px-4 py-3 text-slate-700 font-semibold max-w-[420px] truncate">{c.lastMessagePreview || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/app/conversations/${encodeURIComponent(c.phone)}`} className="inline-flex items-center gap-2 font-black text-brand-700 hover:underline">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-[5px] bg-brand-50 text-brand-700">
                          <MessageSquare size={14} />
                        </span>
                        Open
                      </Link>
                      <Button variant="ghost" className="h-8 px-3" onClick={() => setAssignPhone(c.phone)}>
                        Assign
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500 font-semibold">
                    No leads found yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <AssignLeadModal
        open={!!assignPhone}
        onClose={() => setAssignPhone(null)}
        phone={assignPhone || ""}
        employees={employees || []}
        onAssign={async (employeeId, reason) => {
          if (!assignPhone) return;
          await API.crm.manualAssignLead(assignPhone, { employeeId, reason });
          toast("Lead assigned.", "success");
          reload();
        }}
      />

      <AssignLeadModal
        open={bulkAssignOpen}
        onClose={() => setBulkAssignOpen(false)}
        phone=""
        phones={selectedPhones}
        employees={employees || []}
        onAssign={async (employeeId, reason) => {
          const phones = selectedPhones.slice();
          if (!phones.length) return;
          setLoading(true);
          setError(null);
          const results = await Promise.allSettled(
            phones.map((p) => API.crm.manualAssignLead(p, { employeeId, reason }))
          );
          const failed = results.filter((r) => r.status === "rejected").length;
          const ok = results.length - failed;
          setBulkAssignOpen(false);
          setMultiSelected({});
          reload();
          if (ok) toast(`Assigned ${ok} leads.`, "success");
          if (failed) toast(`Failed ${failed} leads.`, "warning");
        }}
      />
    </div>
  );
}
