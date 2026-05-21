import { useCallback, useMemo, useState } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Select } from "@components/ui/Select";
import { Textarea } from "@components/ui/Textarea";
import { AdminLimitSelect } from "@pages/admin/components/AdminLimitSelect";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { AdminTruncate } from "@pages/admin/components/AdminTruncate";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { Modal } from "@components/ui/Modal";
import { useAdminList } from "@pages/admin/hooks/useAdminList";
import { useToast } from "@shared/providers/ToastContext";
import { Briefcase, User, Mail, Phone, Download, FileText, Calendar, CheckCircle2, XCircle, Clock, Search, ExternalLink, MessageSquare } from "lucide-react";
import { cn } from "@shared/utils/cn";

type Item = any;

export default function AdminCareerApplicationsPage() {
  const { toast } = useToast();
  const fetcher = useCallback(
    (params: { page: number; limit: number; q: string }) =>
      API.admin.careerApplications(params).then((r: any) => ({
        items: r.items || [],
        total: Number(r.total || 0),
        page: Number(r.page || params.page),
        limit: Number(r.limit || params.limit),
        totalPages: Number(r.totalPages || 1),
      })),
    []
  );

  const list = useAdminList<Item>({ fetcher, initialLimit: 25 });
  const [selected, setSelected] = useState<Item | null>(null);
  const [status, setStatus] = useState("new");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedId = selected?.id;
  const resumeName = selected?.resume?.originalName || "";

  const canSave = useMemo(() => !!selectedId && !saving, [selectedId, saving]);

  function pick(item: any) {
    setSelected(item);
    setStatus(String(item?.status || "new"));
    setAdminNote(String(item?.adminNote || ""));
  }

  async function onSave() {
    if (!selectedId || saving) return;
    setSaving(true);
    try {
      await API.admin.updateCareerApplication(selectedId, { status, adminNote });
      toast("Application updated.", "success");
      list.refresh();
      setSelected((prev: any) => (prev ? { ...prev, status, adminNote } : null));
    } catch (e: any) {
      toast(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to update", "error");
    } finally {
      setSaving(false);
    }
  }

  async function onDownloadResume() {
    if (!selectedId) return;
    try {
      const blob = await API.admin.downloadCareerResume(selectedId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = resumeName || `resume_${selectedId}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (e: any) {
      toast("Failed to download resume.", "error");
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar
        title="Talent Acquisition"
        subtitle="Review inbound career applications, manage candidate progression, and store internal screening notes."
        query={list.query}
        setQuery={list.setQuery}
        onRefresh={list.refresh}
        isSyncing={list.loading}
        right={<AdminLimitSelect limit={list.limit} setLimit={list.setLimit} />}
      />

      {list.error ? <Alert variant="danger">{list.error}</Alert> : null}

      {list.loading && !list.items.length ? (
        <TableSkeleton cols={4} rows={10} />
      ) : (
        <>
          <AdminTable
            columns={[
              { key: "id", label: "Reference" },
              { key: "name", label: "Candidate" },
              { key: "role", label: "Applying For" },
              { key: "status", label: "Stage" },
            ]}
          >
            {list.items.length ? (
              list.items.map((a: any) => (
                <tr
                  key={a.id}
                  className={cn(
                    "group hover:bg-slate-50/80 cursor-pointer transition-all duration-200",
                    a.id === selectedId ? "bg-brand-50/60" : ""
                  )}
                  onClick={() => pick(a)}
                >
                  <td className="px-6 py-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">#{a.id?.slice(-8)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                          <User size={16} />
                       </div>
                       <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">{a.name}</div>
                          <div className="text-[10px] font-medium text-slate-400 truncate">{a.email}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <div className="text-xs font-bold text-slate-700 truncate max-w-[200px]">
                          <AdminTruncate text={a.applyingRole} max={36} />
                       </div>
                       <div className="text-[10px] font-medium text-slate-400">{a.department || "General"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest border",
                      a.status === 'shortlisted' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      a.status === 'rejected' ? "bg-red-50 text-red-700 border-red-100" :
                      a.status === 'reviewing' ? "bg-brand-50 text-brand-700 border-brand-100" :
                      "bg-slate-50 text-slate-500 border-slate-100"
                    )}>
                      {a.status === 'shortlisted' ? <CheckCircle2 size={10} /> : a.status === 'rejected' ? <XCircle size={10} /> : <Clock size={10} />}
                      {a.status || "new"}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={4}>
                  No applications found in the current pool.
                </td>
              </tr>
            )}
          </AdminTable>

          <AdminPagination page={list.page} totalPages={list.totalPages} total={list.total} onPageChange={list.setPage} />
        </>
      )}

      {/* Candidate Profile Modal */}
      <Modal 
        isOpen={!!selected} 
        onClose={() => setSelected(null)}
        title="Candidate Profile"
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
               <div className="size-16 rounded-[5px] bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                  <Briefcase size={28} />
               </div>
               <div className="min-w-0">
                  <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{selected.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                     <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded">ID: {selected.id}</span>
                     <span className="text-[10px] font-black uppercase tracking-widest bg-brand-50 text-brand-600 px-2 py-0.5 rounded">{selected.applyingRole}</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Communication</label>
                  <div className="space-y-2">
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Mail size={14} className="text-slate-400" /> {selected.email}
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Phone size={14} className="text-slate-400" /> {selected.whatsappPhone}
                     </div>
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Organization</label>
                  <div className="space-y-2">
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-widest">
                        <Briefcase size={14} className="text-slate-400" /> {selected.department}
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Calendar size={14} className="text-slate-400" /> Applied: {new Date(selected.createdAt).toLocaleDateString()}
                     </div>
                  </div>
               </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-100">
               <div className="grid gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Clock size={12} /> Pipeline Stage
                     </label>
                     <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 font-bold text-slate-700 rounded-[5px] border-slate-200">
                        <option value="new">new</option>
                        <option value="reviewing">reviewing</option>
                        <option value="shortlisted">shortlisted</option>
                        <option value="rejected">rejected</option>
                     </Select>
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <MessageSquare size={12} /> Internal Screening Notes
                     </label>
                     <Textarea 
                       value={adminNote} 
                       onChange={(e) => setAdminNote(e.target.value)} 
                       rows={4} 
                       placeholder="Log candidate feedback, interview results, or technical score..."
                       className="text-xs font-bold text-slate-600 rounded-[5px] border-slate-200 focus:border-brand-500 bg-slate-50/50 focus:bg-white transition-all p-4"
                     />
                  </div>
               </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-100">
               <Button 
                 variant="outline" 
                 onClick={onDownloadResume} 
                 disabled={!selected.resume}
                 className="flex items-center gap-2 border-slate-200 hover:bg-slate-50 h-11 px-6"
               >
                 <FileText size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Candidate Resume</span>
                 <Download size={12} className="ml-1 opacity-50" />
               </Button>
               
               <Button 
                 onClick={onSave} 
                 disabled={!canSave}
                 className="h-11 px-8 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand-500/10"
               >
                 {saving ? "Updating..." : "Synchronize Profile"}
               </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
