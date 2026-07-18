import { useCallback, useState } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { AdminLimitSelect } from "@pages/admin/components/AdminLimitSelect";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { useAdminList } from "@pages/admin/hooks/useAdminList";
import { useToast } from "@shared/providers/ToastContext";
import { cn } from "@shared/utils/cn";
import { CalendarClock, CheckCircle2, Clock, X, XCircle } from "lucide-react";

type LiveDemoStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";

type LiveDemoEnquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  platform: string;
  date: string;
  slot: string;
  notes: string;
  status: LiveDemoStatus;
  createdAt: string;
};

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Pending", value: "Pending" },
  { label: "Confirmed", value: "Confirmed" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
];

function statusClass(status: string) {
  if (status === "Confirmed") return "bg-blue-50 text-blue-700 border-blue-100";
  if (status === "Completed") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "Cancelled") return "bg-rose-50 text-rose-700 border-rose-100";
  return "bg-amber-50 text-amber-700 border-amber-100";
}

function formatDateTime(value: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function AdminLiveDemoEnquiriesPage() {
  const { toast } = useToast();
  const [dateFilter, setDateFilter] = useState("");
  const [selected, setSelected] = useState<LiveDemoEnquiry | null>(null);
  const [savingStatus, setSavingStatus] = useState("");

  const fetcher = useCallback(
    (params: { page: number; limit: number; q: string; filter?: string }) =>
      API.admin
        .liveDemoEnquiries({
          page: params.page,
          limit: params.limit,
          q: params.q,
          status: params.filter,
          date: dateFilter || undefined,
        })
        .then((res: any) => ({
          items: res.items || [],
          total: Number(res.total || 0),
          page: Number(res.page || params.page),
          limit: Number(res.limit || params.limit),
          totalPages: Number(res.totalPages || 1),
        })),
    [dateFilter]
  );

  const list = useAdminList<LiveDemoEnquiry>({ fetcher, initialLimit: 25 });

  async function updateStatus(status: Exclude<LiveDemoStatus, "Pending">) {
    if (!selected || savingStatus) return;
    setSavingStatus(status);
    try {
      const res = await API.admin.updateLiveDemoEnquiryStatus(selected.id, { status });
      toast("Live demo enquiry updated.", "success");
      setSelected(res.enquiry || { ...selected, status });
      list.refresh();
    } catch (err: any) {
      toast(err?.userMessage || err?.response?.data?.message || "Could not update status.", "error");
    } finally {
      setSavingStatus("");
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 md:p-8">
      <AdminToolbar
        title="Live Demo Enquiries"
        subtitle="Review live demo requests, filter by date/status, and update booking status."
        query={list.query}
        setQuery={list.setQuery}
        onRefresh={list.refresh}
        isSyncing={list.loading}
        filterOptions={statusOptions}
        currentFilter={list.filter}
        onFilterChange={list.setFilter}
        right={
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="h-10 min-w-[160px]"
              aria-label="Filter by demo date"
            />
            {dateFilter ? (
              <Button type="button" variant="ghost" onClick={() => setDateFilter("")}>
                Clear Date
              </Button>
            ) : null}
            <AdminLimitSelect limit={list.limit} setLimit={list.setLimit} />
          </div>
        }
      />

      {list.error ? <Alert variant="danger">{list.error}</Alert> : null}

      {list.loading && !list.items.length ? (
        <TableSkeleton cols={5} rows={10} />
      ) : (
        <>
          <AdminTable
            columns={[
              { key: "name", label: "Customer" },
              { key: "platform", label: "Platform" },
              { key: "date", label: "Date" },
              { key: "slot", label: "Slot" },
              { key: "status", label: "Status" },
            ]}
          >
            {list.items.length ? (
              list.items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={cn("cursor-pointer transition-colors hover:bg-slate-50", selected?.id === item.id && "bg-brand-50/50")}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-slate-900">{item.name}</div>
                    <div className="mt-0.5 text-[11px] font-semibold text-slate-400">{item.email}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">{item.platform}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">{item.date}</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-900">{item.slot}</td>
                  <td className="px-6 py-4">
                    <span className={cn("inline-flex rounded-[4px] border px-2 py-1 text-[10px] font-black uppercase tracking-widest", statusClass(item.status))}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={5}>
                  No live demo enquiries found.
                </td>
              </tr>
            )}
          </AdminTable>
          <AdminPagination page={list.page} totalPages={list.totalPages} total={list.total} onPageChange={list.setPage} />
        </>
      )}

      {selected ? (
        <div className="fixed inset-0 z-[900]">
          <button type="button" className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" aria-label="Close live demo details" onClick={() => setSelected(null)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-700">
                  <CalendarClock size={13} />
                  Demo Request
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">{selected.name}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">{selected.email}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-[5px] p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Detail label="Phone" value={selected.phone} />
              <Detail label="Platform" value={selected.platform} />
              <Detail label="Date" value={selected.date} />
              <Detail label="Slot" value={selected.slot} />
              <Detail label="Status" value={selected.status} />
              <Detail label="Created At" value={formatDateTime(selected.createdAt)} />
            </div>

            <div className="mt-5 rounded-[5px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</div>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{selected.notes}</p>
            </div>

            <div className="mt-6 rounded-[5px] border border-slate-200 bg-white p-4">
              <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Admin Actions</div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Button type="button" onClick={() => updateStatus("Confirmed")} disabled={!!savingStatus} className="gap-2">
                  <CheckCircle2 size={14} />
                  Confirm
                </Button>
                <Button type="button" variant="outline" onClick={() => updateStatus("Completed")} disabled={!!savingStatus} className="gap-2">
                  <Clock size={14} />
                  Complete
                </Button>
                <Button type="button" variant="danger" onClick={() => updateStatus("Cancelled")} disabled={!!savingStatus} className="gap-2">
                  <XCircle size={14} />
                  Cancel
                </Button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-4">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-1 break-words text-sm font-bold text-slate-900">{value || "Not set"}</div>
    </div>
  );
}
