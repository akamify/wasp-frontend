import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Alert } from "@components/ui/Alert";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { cn } from "@shared/utils/cn";
import { MessageSquare, Search, RefreshCw } from "lucide-react";
import { CrmSectionNav } from "@modules/crm/components/CrmSectionNav";
import { AssignLeadModal } from "@modules/crm/components/AssignLeadModal";
import { useToast } from "@shared/providers/ToastContext";
import { LeadsTableCard } from "./leads/LeadsTableCard";
import { isActiveStatus, type Conversation } from "./leads/leads.utils";
import { CrmLeadsSkeleton } from "@components/ui/Skeletons";

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
  }, []);

  const leads = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    return (items || [])
      .filter((c) => {
        const isLead = !!c.leadStatus || !!c.assignedEmployeeId;
        if (!isLead) return false;
        if (filterKey === "assigned" && !c.assignedEmployeeId) return false;
        if (filterKey === "unassigned" && !!c.assignedEmployeeId) return false;
        if (filterKey === "active" && !isActiveStatus(c.leadStatus)) return false;
        if (!q) return true;
        const hay = [c.phone, c.lastMessagePreview, c.contact?.name, c.contact?.company].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
  }, [filterKey, items, search]);

  const selectedPhones = useMemo(() => Object.keys(multiSelected || {}).filter((p) => multiSelected[p]), [multiSelected]);
  const selectedCount = selectedPhones.length;
  const someSelected = selectedCount > 0;
  const allSelected = leads.length > 0 && leads.every((c) => !!multiSelected[c.phone]);

  if (loading && !items.length) return <CrmLeadsSkeleton />;

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">CRM</div>
          <h1 className="mt-1 text-3xl font-black tracking-tighter text-slate-900 md:text-4xl">Leads</h1>
          <p className="mt-2 font-medium text-slate-500">Workspace conversations with CRM lead status + assignment.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" disabled={loading} onClick={reload} className="gap-2"><RefreshCw size={16} /> Refresh</Button>
          <Link to="/app/conversations"><Button className="gap-2"><MessageSquare size={16} /> Inbox</Button></Link>
        </div>
      </div>

      <CrmSectionNav />
      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[5px] border-slate-200 p-4 shadow-sm md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-[5px] bg-slate-50 p-2 text-slate-700"><Search size={18} /></div>
            <div className="flex-1"><Input label="Search by phone / name / company" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          </div>
        </Card>
        <Card className="rounded-[5px] border-slate-200 p-4 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lead rows</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{loading ? "..." : leads.length}</div>
          <div className="mt-1 text-xs font-medium text-slate-500">Showing assigned/statused conversations.</div>
        </Card>
      </div>

      <LeadsTableCard
        leads={leads}
        loading={loading}
        filterKey={filterKey}
        setFilterKey={setFilterKey}
        multiSelected={multiSelected}
        setMultiSelected={setMultiSelected}
        someSelected={someSelected}
        selectedCount={selectedCount}
        allSelected={allSelected}
        onAssign={setAssignPhone}
        onBulkAssign={() => setBulkAssignOpen(true)}
        onClearSelection={() => setMultiSelected({})}
      />

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
          const results = await Promise.allSettled(phones.map((p) => API.crm.manualAssignLead(p, { employeeId, reason })));
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
