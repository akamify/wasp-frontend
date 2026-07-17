import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { cn } from "@shared/utils/cn";
import { Plus, ShieldAlert, UserX, Users, Pencil } from "lucide-react";
import { CrmSectionNav } from "@modules/crm/components/CrmSectionNav";
import { CrmEmployeeUpsertModal } from "@modules/crm/components/CrmEmployeeUpsertModal";
import { CrmEmployeesSkeleton } from "@components/ui/Skeletons";

type Employee = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: "ACTIVE" | "BLOCKED" | "DISABLED" | "DELETED";
  assignedChatsCount: number;
  maxActiveLeads?: number | null;
  lastLoginAt?: string | null;
  lastActivityAt?: string | null;
  createdAt?: string;
};

type EmployeesRes = { success: boolean; items: Employee[] };

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function CrmEmployeesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [upsertOpen, setUpsertOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [busy, setBusy] = useState(false);

  function reload() {
    setLoading(true);
    setError(null);
    API.crm
      .employees()
      .then((res: EmployeesRes) => setItems(Array.isArray(res?.items) ? res.items : []))
      .catch((e: any) => setError(e?.response?.data?.message || "Failed to load employees"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCount = useMemo(() => items.filter((e) => e.status === "ACTIVE").length, [items]);
  const blockedCount = useMemo(() => items.filter((e) => e.status === "BLOCKED").length, [items]);

  async function updateStatus(employeeId: string, nextStatus: Employee["status"]) {
    if (!window.confirm(`Set employee status to ${nextStatus}?`)) return;
    setBusy(true);
    setError(null);
    try {
      await API.crm.updateEmployeeStatus(employeeId, nextStatus);
      reload();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !items.length) return <CrmEmployeesSkeleton />;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">CRM</div>
          <h1 className="mt-1 text-3xl md:text-4xl font-black tracking-tighter text-slate-900">Employees</h1>
          <p className="mt-2 text-slate-500 font-medium">Manage employee inbox access and assignment eligibility.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setEditingEmployee(null);
              setUpsertOpen(true);
            }}
            className="gap-2"
          >
            <Plus size={16} /> New Employee
          </Button>
          <Button variant="ghost" disabled={loading || busy} onClick={reload}>
            Refresh
          </Button>
        </div>
      </div>

      <CrmSectionNav />

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 border-slate-200 shadow-sm rounded-[5px]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{loading ? "..." : items.length}</div>
            </div>
            <div className="p-2 rounded-[5px] bg-slate-50 text-slate-700">
              <Users size={18} />
            </div>
          </div>
        </Card>
        <Card className="p-4 border-slate-200 shadow-sm rounded-[5px]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{loading ? "..." : activeCount}</div>
            </div>
            <div className="p-2 rounded-[5px] bg-emerald-50 text-emerald-700">
              <Users size={18} />
            </div>
          </div>
        </Card>
        <Card className="p-4 border-slate-200 shadow-sm rounded-[5px]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Blocked</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{loading ? "..." : blockedCount}</div>
            </div>
            <div className="p-2 rounded-[5px] bg-rose-50 text-rose-700">
              <ShieldAlert size={18} />
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-[5px] overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-sm font-black text-slate-900">Employees</div>
          <div className="text-[11px] font-semibold text-slate-500">{loading ? "Loading..." : `${items.length} records`}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-[12px]">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Name</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Email</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Status</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Assigned</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Lead Cap</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Last login</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Last activity</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr
                  key={e.id}
                  className="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer"
                  onClick={() => navigate(`/app/crm/employees/${encodeURIComponent(e.id)}`)}
                >
                  <td className="px-4 py-3 font-black text-slate-900">{e.name || "-"}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{e.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-[5px] px-2 py-1 text-[10px] font-black uppercase tracking-widest border",
                        e.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : e.status === "BLOCKED"
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                      )}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-black text-slate-900">{Number(e.assignedChatsCount || 0)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{e.maxActiveLeads == null ? "Unlimited" : Number(e.maxActiveLeads || 0)}</td>
                  <td className="px-4 py-3 text-slate-600 font-semibold">{fmtDate(e.lastLoginAt)}</td>
                  <td className="px-4 py-3 text-slate-600 font-semibold">{fmtDate(e.lastActivityAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        className="h-8 px-3"
                        disabled={busy}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setEditingEmployee(e);
                          setUpsertOpen(true);
                        }}
                      >
                        <Pencil size={16} className="mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 px-3"
                        disabled={busy}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          updateStatus(e.id, e.status === "BLOCKED" ? "ACTIVE" : "BLOCKED");
                        }}
                      >
                        <ShieldAlert size={16} className="mr-2" />
                        {e.status === "BLOCKED" ? "Unblock" : "Block"}
                      </Button>
                      <Button
                        variant="danger"
                        className="h-8 px-3"
                        disabled={busy}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          updateStatus(e.id, "DELETED");
                        }}
                      >
                        <UserX size={16} className="mr-2" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500 font-semibold">
                    No employees yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <CrmEmployeeUpsertModal
        open={upsertOpen}
        onClose={() => setUpsertOpen(false)}
        employee={
          editingEmployee
            ? {
                id: editingEmployee.id,
                email: editingEmployee.email,
                name: editingEmployee.name,
                role: editingEmployee.role,
                maxActiveLeads: editingEmployee.maxActiveLeads,
              }
            : null
        }
        onSaved={reload}
      />
    </div>
  );
}
