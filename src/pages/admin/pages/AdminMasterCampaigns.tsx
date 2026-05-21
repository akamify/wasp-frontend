import { useCallback } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { AdminLimitSelect } from "@pages/admin/components/AdminLimitSelect";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { AdminTruncate } from "@pages/admin/components/AdminTruncate";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { useAdminList } from "@pages/admin/hooks/useAdminList";
import { Megaphone, Briefcase, FileText, Zap, Activity, Calendar } from "lucide-react";
import { cn } from "@shared/utils/cn";

type Item = any;

export default function AdminMasterCampaignsPage() {
  const fetcher = useCallback(
    (params: { page: number; limit: number; q: string }) =>
      API.admin.masterCampaigns(params).then((r: any) => ({
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

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar
        title="Master Campaigns"
        subtitle="Global view of all marketing and transactional campaigns across all workspaces."
        query={list.query}
        setQuery={list.setQuery}
        onRefresh={list.refresh}
        isSyncing={list.loading}
        filterOptions={[
          { label: "All Campaigns", value: "all" },
          { label: "Processing", value: "processing" },
          { label: "Completed", value: "completed" },
          { label: "Paused", value: "paused" },
        ]}
        currentFilter={list.filter}
        onFilterChange={list.setFilter}
        sortOptions={[
          { label: "Recent", value: "recent" },
          { label: "Engagement", value: "engagement" },
          { label: "Name", value: "name" },
        ]}
        currentSort={list.sort}
        onSortChange={list.setSort}
        right={<AdminLimitSelect limit={list.limit} setLimit={list.setLimit} options={[10, 25, 50, 100]} />}
      />

      {list.error ? <Alert variant="danger">{list.error}</Alert> : null}

      {list.loading && !list.items.length ? (
        <TableSkeleton cols={7} rows={10} />
      ) : (
        <>
          <AdminTable
            columns={[
              { key: "name", label: "Campaign Name" },
              { key: "workspace", label: "Workspace" },
              { key: "template", label: "Template" },
              { key: "type", label: "Type" },
              { key: "status", label: "Status" },
              { key: "totals", label: "Engagement" },
              { key: "created", label: "Created" },
            ]}
          >
            {list.items.length ? (
              list.items.map((c: any) => (
                <tr key={c.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="size-10 rounded-[5px] bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                          <Megaphone size={18} />
                       </div>
                       <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                             <AdminTruncate text={c.name} max={35} />
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">UUID: {c.id?.slice(-8)}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                       <Briefcase size={14} className="text-slate-400" />
                       <AdminTruncate text={c.workspace?.name || "N/A"} max={20} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                       <FileText size={14} className="text-slate-400" />
                       <AdminTruncate text={c.template?.name || "N/A"} max={20} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-[4px] text-[10px] font-black uppercase tracking-widest">
                       <Zap size={10} />
                       {c.type || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest border",
                      c.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      c.status === 'processing' ? "bg-blue-50 text-blue-700 border-blue-100 animate-pulse" :
                      "bg-slate-100 text-slate-600 border-slate-200"
                    )}>
                      <Activity size={10} />
                      {c.status || "UNKNOWN"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 w-32">
                       <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                          <span>{c.totals?.sent || 0} / {c.totals?.total || 0} Sent</span>
                          <span>{Math.round(((c.totals?.sent || 0) / (c.totals?.total || 1)) * 100)}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <div 
                            className="h-full bg-brand-500 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, ((c.totals?.sent || 0) / (c.totals?.total || 1)) * 100)}%` }}
                          />
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "N/A"}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={7}>
                  No campaigns found.
                </td>
              </tr>
            )}
          </AdminTable>

          <AdminPagination page={list.page} totalPages={list.totalPages} total={list.total} onPageChange={list.setPage} />
        </>
      )}
    </div>
  );
}

