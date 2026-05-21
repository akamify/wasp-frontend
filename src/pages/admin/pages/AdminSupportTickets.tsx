import { useCallback, useMemo, useState } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Textarea } from "@components/ui/Textarea";
import { Modal } from "@components/ui/Modal";
import { AdminLimitSelect } from "@pages/admin/components/AdminLimitSelect";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { AdminTruncate } from "@pages/admin/components/AdminTruncate";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { useAdminList } from "@pages/admin/hooks/useAdminList";
import { useToast } from "@shared/providers/ToastContext";
import { MessageCircle, Mail, User, Phone, Calendar, CheckCircle2, Clock, AlertCircle, Send, X, ShieldQuestion } from "lucide-react";
import { cn } from "@shared/utils/cn";

type Item = any;

export default function AdminSupportTicketsPage() {
  const { toast } = useToast();

  const fetcher = useCallback(
    (params: { page: number; limit: number; q: string }) =>
      API.admin.supportTickets(params).then((r: any) => ({
        items: r.items || [],
        total: Number(r.total || 0),
        page: Number(r.page || params.page),
        limit: Number(r.limit || params.limit),
        totalPages: Number(r.totalPages || 1),
      })),
    []
  );

  const list = useAdminList<Item>({ 
    fetcher, 
    initialLimit: 25,
    initialFilter: "all",
    initialSort: "recent"
  });
  const [selected, setSelected] = useState<any | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedId = selected?.id;
  const canResolve = useMemo(
    () => !!selectedId && !saving && String(selected?.status || "open") !== "resolved",
    [selectedId, saving, selected]
  );

  function pick(t: any) {
    setSelected(t);
    setResolutionNote(String(t?.resolutionNote || ""));
    setIsModalOpen(true);
  }

  async function onResolve() {
    if (!selectedId || saving) return;
    setSaving(true);
    try {
      await API.admin.resolveSupportTicket(selectedId, { resolutionNote });
      toast("Ticket resolved.", "success");
      list.refresh();
      setSelected((prev: any) => (prev ? { ...prev, status: "resolved", resolutionNote } : prev));
      setIsModalOpen(false);
    } catch (e: any) {
      toast(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to resolve ticket", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar
        title="Support Tickets"
        subtitle="Manage user support requests and platform feedback directly."
        query={list.query}
        setQuery={list.setQuery}
        onRefresh={list.refresh}
        isSyncing={list.loading}
        filterOptions={[
          { label: "All Tickets", value: "all" },
          { label: "Open", value: "open" },
          { label: "Resolved", value: "resolved" },
        ]}
        currentFilter={list.filter}
        onFilterChange={list.setFilter}
        sortOptions={[
          { label: "Recent", value: "recent" },
          { label: "Oldest", value: "old" },
          { label: "Subject", value: "subject" },
        ]}
        currentSort={list.sort}
        onSortChange={list.setSort}
        right={<AdminLimitSelect limit={list.limit} setLimit={list.setLimit} />}
      />

      {list.error ? <Alert variant="danger">{list.error}</Alert> : null}

      {list.loading && !list.items.length ? (
        <TableSkeleton cols={4} rows={10} />
      ) : (
        <>
          <AdminTable
            columns={[
              { key: "id", label: "Ticket ID" },
              { key: "subject", label: "Subject" },
              { key: "email", label: "Contact Info" },
              { key: "status", label: "Status" },
            ]}
          >
            {list.items.length ? (
              list.items.map((t: any) => (
                <tr
                  key={t.id}
                  className={cn(
                    "group hover:bg-slate-50/80 cursor-pointer transition-all duration-200",
                    t.id === selectedId ? "bg-brand-50/50" : ""
                  )}
                  onClick={() => pick(t)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="size-10 rounded-[5px] bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                          <ShieldQuestion size={18} />
                       </div>
                       <div className="min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">UUID</div>
                          <div className="text-xs font-bold text-slate-700 truncate">{t.id?.slice(-12)}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900 truncate max-w-md">
                       <AdminTruncate text={t.subject} max={60} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Mail size={12} className="text-slate-400" />
                          <AdminTruncate text={t.email} max={30} />
                       </div>
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                          <User size={10} className="text-slate-300" />
                          {t.name || "Anonymous"}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest border",
                      t.status === 'resolved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                    )}>
                      {t.status === 'resolved' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                      {t.status || "OPEN"}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={4}>
                  No support tickets found.
                </td>
              </tr>
            )}
          </AdminTable>

          <AdminPagination page={list.page} totalPages={list.totalPages} total={list.total} onPageChange={list.setPage} />
        </>
      )}

      {/* Modern Ticket Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Support Ticket Details">
        {selected && (
          <div className="flex flex-col gap-6 p-1">
            <div className="flex items-start justify-between bg-slate-50 p-4 rounded-[5px] border border-slate-100">
               <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Subject</div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{selected.subject}</h3>
               </div>
               <div className={cn(
                  "px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest border",
                  selected.status === 'resolved' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"
               )}>
                 {selected.status || "OPEN"}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                     <User size={10} /> User Information
                  </div>
                  <div className="text-sm font-bold text-slate-700">{selected.name}</div>
                  <div className="text-xs font-medium text-slate-500">{selected.email}</div>
                  {selected.phone && <div className="text-xs font-medium text-slate-500">{selected.phone}</div>}
               </div>
               <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                     <Calendar size={10} /> Submitted On
                  </div>
                  <div className="text-sm font-bold text-slate-700">
                    {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : "—"}
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    {selected.createdAt ? new Date(selected.createdAt).toLocaleTimeString() : "—"}
                  </div>
               </div>
            </div>

            <div className="space-y-2">
               <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">User Message</div>
               <div className="p-4 bg-white border border-slate-200 rounded-[5px] text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                  {selected.message}
               </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resolution Note</label>
                     <span className="text-[10px] font-bold text-slate-400">Internal & shared via email</span>
                  </div>
                  <Textarea
                    placeholder="Enter resolution details, steps taken, or reply to user..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    rows={4}
                    className="rounded-[5px] border-slate-200 focus:border-brand-500 transition-colors"
                  />
               </div>
               
               <Button 
                 onClick={onResolve} 
                 disabled={!canResolve}
                 className="w-full h-12 text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-500/10"
               >
                 {saving ? "Processing..." : selected.status === "resolved" ? "Ticket Resolved" : "Mark as Resolved & Notify User"}
               </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

