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
import { Zap, Phone, Briefcase, Calendar, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@shared/utils/cn";

type Item = any;

export default function AdminNotificationsPage() {
  const fetcher = useCallback(
    (params: { page: number; limit: number; q: string }) =>
      API.admin.notifications(params).then((r: any) => ({
        items: r.items || [],
        total: Number(r.total || 0),
        page: Number(r.page || params.page),
        limit: Number(r.limit || params.limit),
        totalPages: Number(r.totalPages || 1),
      })),
    []
  );

  const list = useAdminList<Item>({ fetcher, initialLimit: 25 });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar
        title="Event Notifications"
        subtitle="System-wide automation logs, delivery receipts, and integration workflow events."
        query={list.query}
        setQuery={list.setQuery}
        onRefresh={list.refresh}
        isSyncing={list.loading}
        right={<AdminLimitSelect limit={list.limit} setLimit={list.setLimit} />}
      />

      {list.error ? <Alert variant="danger">{list.error}</Alert> : null}

      {list.loading && !list.items.length ? (
        <TableSkeleton cols={5} rows={10} />
      ) : (
        <>
          <AdminTable
            columns={[
              { key: "event", label: "Event Type" },
              { key: "phone", label: "Recipient" },
              { key: "status", label: "Status" },
              { key: "workspace", label: "Origin" },
              { key: "created", label: "Timestamp" },
            ]}
          >
            {list.items.length ? (
              list.items.map((e: any) => (
                <tr key={e.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="size-10 rounded-[5px] bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                          <Zap size={18} />
                       </div>
                       <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                             <AdminTruncate text={e.eventName} max={40} />
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Workflow Trigger</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                       <Phone size={12} className="text-slate-400" />
                       <AdminTruncate text={e.phone || "N/A"} max={20} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest border",
                      e.status === 'success' || e.status === 'delivered' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      e.status === 'failed' || e.status === 'error' ? "bg-red-50 text-red-700 border-red-100" :
                      "bg-amber-50 text-amber-700 border-amber-100"
                    )}>
                      {e.status === 'success' || e.status === 'delivered' ? <CheckCircle2 size={10} /> : e.status === 'failed' || e.status === 'error' ? <AlertCircle size={10} /> : <Clock size={10} />}
                      {e.status || "PENDING"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                       <Briefcase size={14} className="text-slate-400" />
                       <AdminTruncate text={e.workspace?.name || e.workspaceId || "System"} max={18} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar size={12} className="text-slate-400" />
                      {e.createdAt ? new Date(e.createdAt).toLocaleString() : "—"}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={5}>
                  No event notifications recorded.
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
