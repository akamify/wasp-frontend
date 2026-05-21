import { useCallback, useMemo, useState } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Textarea } from "@components/ui/Textarea";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import { AdminLimitSelect } from "@pages/admin/components/AdminLimitSelect";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { AdminTruncate } from "@pages/admin/components/AdminTruncate";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { useAdminList } from "@pages/admin/hooks/useAdminList";
import { useToast } from "@shared/providers/ToastContext";
import { FileText, Briefcase, User, Globe, Tag, Activity, Settings, X, RefreshCw, Trash2, Save } from "lucide-react";
import { cn } from "@shared/utils/cn";

type Item = any;

export default function AdminMasterTemplatesPage() {
  const { toast } = useToast();

  const fetcher = useCallback(
    (params: { page: number; limit: number; q: string }) =>
      API.admin.masterTemplates(params).then((r: any) => ({
        items: r.items || [],
        total: Number(r.total || 0),
        page: Number(r.page || params.page),
        limit: Number(r.limit || params.limit),
        totalPages: Number(r.totalPages || 1),
      })),
    []
  );

  const list = useAdminList<Item>({ fetcher, initialLimit: 25 });
  const [selected, setSelected] = useState<any | null>(null);
  const [componentsJson, setComponentsJson] = useState("");
  const [syncName, setSyncName] = useState("");
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedId = selected?.id;
  const workspaceId = selected?.workspace?.id || "";

  const canSaveComponents = useMemo(() => !!selectedId && !saving, [selectedId, saving]);

  function pick(t: any) {
    setSelected(t);
    setComponentsJson(JSON.stringify(t?.components || [], null, 2));
    setSyncName("");
    setIsModalOpen(true);
  }

  async function onSaveComponents() {
    if (!selectedId || saving) return;
    setSaving(true);
    try {
      let parsed: any = [];
      try {
        parsed = JSON.parse(componentsJson || "[]");
      } catch {
        throw new Error("Invalid JSON in components");
      }
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Components must be a non-empty JSON array");
      const res = await API.admin.masterTemplateUpdate(selectedId, { components: parsed });
      toast("Template updated.", "success");
      const updated = res?.template || null;
      if (updated) {
        setSelected((prev: any) => (prev ? { ...prev, ...updated } : prev));
        setComponentsJson(JSON.stringify(updated.components || [], null, 2));
      }
      list.refresh();
    } catch (e: any) {
      toast(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to update template", "error");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!selectedId || saving) return;
    if (!confirm("Delete this template? This may also delete it from Meta if linked.")) return;
    setSaving(true);
    try {
      await API.admin.masterTemplateDelete(selectedId);
      toast("Template deleted.", "success");
      setSelected(null);
      setComponentsJson("");
      setIsModalOpen(false);
      list.refresh();
    } catch (e: any) {
      toast(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to delete template", "error");
    } finally {
      setSaving(false);
    }
  }

  async function onSyncStatus() {
    if (!selectedId || saving) return;
    setSaving(true);
    try {
      const r = await API.admin.masterTemplateSyncStatus(selectedId);
      toast("Status synced.", "success");
      const updated = r?.template || null;
      if (updated) {
        setSelected((prev: any) => (prev ? { ...prev, ...updated } : prev));
      }
      list.refresh();
    } catch (e: any) {
      toast(e?.userMessage || e?.response?.data?.message || e?.message || "Sync failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function onSyncMetaWorkspace() {
    if (!workspaceId || saving) return;
    setSaving(true);
    try {
      await API.admin.masterTemplateSyncMeta({ workspaceId, name: syncName.trim() || undefined });
      toast("Meta templates synced.", "success");
      list.refresh();
    } catch (e: any) {
      toast(e?.userMessage || e?.response?.data?.message || e?.message || "Meta sync failed", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar
        title="Master Templates"
        subtitle="Global message template repository with Meta synchronization capabilities."
        query={list.query}
        setQuery={list.setQuery}
        onRefresh={list.refresh}
        isSyncing={list.loading}
        right={<AdminLimitSelect limit={list.limit} setLimit={list.setLimit} />}
      />

      {list.error ? <Alert variant="danger">{list.error}</Alert> : null}

      {list.loading && !list.items.length ? (
        <TableSkeleton cols={6} rows={10} />
      ) : (
        <>
          <AdminTable
            columns={[
              { key: "name", label: "Template Name" },
              { key: "workspace", label: "Workspace" },
              { key: "owner", label: "Owner" },
              { key: "lang", label: "Lang" },
              { key: "category", label: "Category" },
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
                          <FileText size={18} />
                       </div>
                       <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                             <AdminTruncate text={t.name} max={35} />
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID: {t.id?.slice(-8)}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                       <Briefcase size={14} className="text-slate-400" />
                       <AdminTruncate text={t.workspace?.name || "N/A"} max={20} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                       <User size={14} className="text-slate-400" />
                       <AdminTruncate text={t.workspace?.owner?.email || "Unknown"} max={30} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-[4px] text-[10px] font-black uppercase tracking-widest">
                       <Globe size={10} />
                       {t.language || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 text-slate-500 rounded-[4px] text-[10px] font-black uppercase tracking-widest border border-slate-100">
                       <Tag size={10} />
                       {t.category || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest border",
                      t.status === 'APPROVED' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      t.status === 'PENDING' ? "bg-amber-50 text-amber-700 border-amber-100 animate-pulse" :
                      "bg-slate-100 text-slate-600 border-slate-200"
                    )}>
                      <Activity size={10} />
                      {t.status || "UNKNOWN"}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={6}>
                  No templates found.
                </td>
              </tr>
            )}
          </AdminTable>

          <AdminPagination page={list.page} totalPages={list.totalPages} total={list.total} onPageChange={list.setPage} />
        </>
      )}

      {/* Modern Management Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Manage Template">
        {selected && (
          <div className="flex flex-col gap-6 p-1">
            <div className="flex items-start justify-between">
               <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{selected.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-[4px]">
                       Workspace: {selected.workspace?.name || "—"}
                     </span>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-[4px]">
                       ID: {selected.workspace?.id || "—"}
                     </span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onSyncStatus} 
                disabled={saving}
                className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-[5px] text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
              >
                <RefreshCw size={14} className={cn(saving && "animate-spin")} />
                Sync Status
              </button>
              <button 
                onClick={onDelete} 
                disabled={saving}
                className="flex items-center justify-center gap-2 py-3 bg-red-50 border border-red-100 rounded-[5px] text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-100 transition-all disabled:opacity-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>

            <div className="p-4 bg-amber-50 rounded-[5px] border border-amber-100 border-dashed">
               <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                 <span className="font-black uppercase tracking-widest mr-1 underline">Meta Sync:</span> 
                 Pull all templates from Meta for this workspace if they are missing or outdated.
               </p>
               <div className="flex gap-2 mt-4">
                  <Input
                    className="flex-1 bg-white h-10"
                    placeholder="Exact template name (optional)"
                    value={syncName}
                    onChange={(e) => setSyncName(e.target.value)}
                  />
                  <Button 
                    variant="secondary" 
                    className="h-10 px-6 font-black uppercase tracking-widest text-[10px]"
                    onClick={onSyncMetaWorkspace} 
                    disabled={saving || !workspaceId}
                  >
                    Sync Meta
                  </Button>
               </div>
            </div>

            <div className="space-y-2">
               <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Components (JSON Structure)</label>
                  <span className="text-[10px] font-bold text-slate-400">Read-only unless manual edit is required</span>
               </div>
               <Textarea
                 value={componentsJson}
                 onChange={(e) => setComponentsJson(e.target.value)}
                 rows={12}
                 className="font-mono text-xs bg-slate-900 text-slate-300 border-none rounded-[5px] p-4 focus:ring-2 focus:ring-brand-500/20 selection:bg-brand-500/30"
               />
               <Button 
                 onClick={onSaveComponents} 
                 disabled={!canSaveComponents}
                 className="w-full h-12 text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-500/20"
               >
                 {saving ? "Processing..." : "Save Template Changes"}
               </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

