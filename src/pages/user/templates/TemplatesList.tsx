import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, Trash2, MessageSquare, Folder, ShieldCheck, Megaphone, Package } from "lucide-react";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { TemplatesTableSkeleton } from "@components/ui/Skeletons";
import { statusTone, truncateTemplateName } from "@pages/user/templates/helpers";
import type { TemplateItem } from "@pages/user/templates/types";
import { cn } from "@shared/utils/cn";
import { useToast } from "@shared/providers/ToastContext";
import { API, clearApiGetCache } from "@api/api";
import { TemplatesListToolbar } from "@pages/user/templates/TemplatesListToolbar";

type Props = {
  templates: TemplateItem[];
  loading: boolean;
  syncing: boolean;
  onRefresh: () => void;
  busyId: string | null;
  selectedId: string | null;
  onOpenAdd: () => void;
  onSelectTemplate: (template: TemplateItem) => void;
  onSyncStatus: (id: string) => void;
  onDelete: (template: TemplateItem) => void;
  onEdit: (template: TemplateItem) => void;
};

export function TemplatesList(props: Props) {
  const {
    templates,
    loading,
    onRefresh,
    busyId,
    selectedId,
    onOpenAdd,
    onSelectTemplate,
    onSyncStatus,
    onDelete,
  } = props;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy] = useState("newest");
  const [pageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const categoryMeta = (category: string) => {
    const c = String(category || "").toLowerCase();
    if (c === "authentication") return { Icon: ShieldCheck, label: "Authentication", color: "text-blue-600", bg: "bg-blue-50" };
    if (c === "marketing") return { Icon: Megaphone, label: "Marketing", color: "text-brand-600", bg: "bg-brand-50" };
    return { Icon: Package, label: c || "Utility", color: "text-indigo-600", bg: "bg-indigo-50" };
  };

  const handleSyncMeta = useCallback(async () => {
    setSyncing(true);
    try {
      await API.templates.refreshWhatsApp();
      clearApiGetCache();
      toast("WhatsApp templates synced successfully.", "success");
      onRefresh();
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to sync WhatsApp templates", "error");
    } finally {
      setSyncing(false);
    }
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = templates.filter((template) => {
      const matchesSearch = !term || template.name.toLowerCase().includes(term) || template.category.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || template.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
    if (sortBy === "name_asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "name_desc") list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    if (sortBy === "oldest") list = [...list].reverse();
    return list;
  }, [templates, search, statusFilter, sortBy]);

  const total = filteredTemplates.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, total);

  const pagedTemplates = useMemo(
    () => filteredTemplates.slice(pageStart, pageEnd),
    [filteredTemplates, pageStart, pageEnd]
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy, pageSize]);

  return (
    <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm overflow-hidden">
      {/* Main List Container */}
      <div className="p-2 md:p-8">
        <TemplatesListToolbar
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          syncing={syncing}
          onSyncMeta={handleSyncMeta}
          onOpenAdd={onOpenAdd}
          total={total}
          pageStart={pageStart}
          pageEnd={pageEnd}
          safePage={safePage}
          totalPages={totalPages}
          onPrevPage={() => setPage((p) => Math.max(p - 1, 1))}
          onNextPage={() => setPage((p) => Math.min(p + 1, totalPages))}
        />

        {/* Content Area */}
        <div className="relative">
          {loading ? (
            <div className="py-8">
              <table className="w-full">
                <tbody>
                  <TemplatesTableSkeleton rows={8} />
                </tbody>
              </table>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-20 flex flex-col items-center text-center">
              <div className="p-6 bg-slate-50 rounded-[5px] text-slate-300 mb-6">
                <Folder size={48} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">No Templates Found</h3>
              <p className="mt-2 text-slate-500 font-medium max-w-xs">Adjust your search or filters to find what you're looking for.</p>
            </div>
          ) : false ? (
            <div className="p-6 md:p-8 cursor-pointer grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pagedTemplates.map((template) => {
                const { Icon, label, color, bg } = categoryMeta(template.category);
                return (
                  <div
                    key={template._id}
                    className={cn(
                      "group p-6 rounded-[5px] cursor-pointer border transition-all duration-300 relative",
                      selectedId === template._id ? "border-brand-600 bg-brand-50/20 cursor-pointer" : "border-slate-100 bg-white cursor-pointer hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/40"
                    )}
                  >
                    <div className="flex items-start justify-between cursor-pointer mb-6">
                      <div className={cn("p-3 rounded-[5px]", bg, color)}>
                        <Icon size={20} />
                      </div>
                      <Badge tone={statusTone(template.status)} className="rounded-[5px] px-3 py-1 text-[10px] uppercase font-black tracking-widest">{template.status}</Badge>
                    </div>
                    <h5 className="font-black text-slate-900 truncate mb-1 group-hover:text-brand-600 transition-colors" title={template.name}>
                      {truncateTemplateName(template.name)}
                    </h5>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{label}</p>

                    <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                      <Button
                        variant="ghost"
                        onClick={() => onSelectTemplate(template)}
                        className="flex-1 h-10 rounded-[5px] bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                      >
                        <Eye size={14} className="mr-2" /> View
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => onSyncStatus(template._id)}
                        disabled={busyId === template._id}
                        className="h-10 w-10 rounded-[5px] bg-slate-50 text-slate-400 hover:text-brand-600 transition-all shrink-0"
                      >
                        <RefreshCw size={14} className={busyId === template._id ? "animate-spin" : ""} />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => onDelete(template)}
                        disabled={busyId === template._id}
                        className="h-10 w-10 rounded-[5px] bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all shrink-0"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-2 py-2 md:px-8 md:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="px-2 py-2 md:px-8 md:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-10 py-2 md:px-8 md:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    <th className="px-8 py-2 md:px-8 md:py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Template Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pagedTemplates.map((template) => {
                    const { Icon, label, color, bg } = categoryMeta(template.category);
                    return (
                      <tr
                        key={template._id}
                        className={cn("group transition-colors", selectedId === template._id ? "bg-brand-50/20" : "hover:bg-slate-50/40")}
                      >
                        <td className="pl-2 pr-0 py-3 md:px-8 md:py-5 cursor-pointer" onClick={() => onSelectTemplate(template)}>
                          <button
                            onClick={() => onSelectTemplate(template)}
                            className="flex items-center gap-4 text-left group"
                          >
                            <div className="p-2.5 rounded-[5px] bg-slate-100 text-slate-400 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-sm">
                              <MessageSquare size={16} />
                            </div>
                            <div className="font-black text-slate-900 text-sm group-hover:text-brand-600 transition-colors truncate max-w-[250px]" title={template.name}>
                              {truncateTemplateName(template.name)}
                            </div>
                          </button>
                        </td>
                        <td className="pl-0 pr-2 py-3 md:px-8 md:py-5">
                          <div className="flex items-center gap-2">
                            <div className={cn("p-1.5 rounded-[5px]", bg, color)}>
                              <Icon size={14} />
                            </div>
                            <span className="text-xs font-bold text-slate-600">{label}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3 md:px-8 md:py-5">
                          <Badge tone={statusTone(template.status)} className="rounded-[5px] px-3 py-1 text-[10px] uppercase font-black tracking-widest">
                            {template.status}
                          </Badge>
                        </td>
                        <td className="px-2 py-3 md:px-8 md:py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSelectTemplate(template)}
                              className="h-10 px-4 rounded-[5px] bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                            >
                              <Eye size={12} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSyncStatus(template._id)}
                              disabled={busyId === template._id}
                              className="h-10 px-4 rounded-[5px] bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                            >
                              <RefreshCw size={14} className={busyId === template._id ? "animate-spin" : ""} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(template)}
                              disabled={busyId === template._id}
                              className="h-10 px-4 rounded-[5px] bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

