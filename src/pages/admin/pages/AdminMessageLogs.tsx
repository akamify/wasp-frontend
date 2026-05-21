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
import { MessageSquare, ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertCircle, Clock, Briefcase, Megaphone, Calendar } from "lucide-react";
import { cn } from "@shared/utils/cn";

type Item = any;

export default function AdminMessageLogsPage() {
  const fetcher = useCallback(
    (params: { page: number; limit: number; q: string; filter?: string; sort?: string }) =>
      API.admin.messageLogs(params).then((r: any) => ({
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
        title="Message Logs"
        subtitle="Comprehensive audit trail of all platform-wide inbound and outbound WhatsApp traffic."
        query={list.query}
        setQuery={list.setQuery}
        onRefresh={list.refresh}
        isSyncing={list.loading}
        filterOptions={[
          { label: "All Traffic", value: "all" },
          { label: "Inbound", value: "inbound" },
          { label: "Outbound", value: "outbound" },
          { label: "Failed", value: "failed" },
        ]}
        currentFilter={list.filter}
        onFilterChange={list.setFilter}
        sortOptions={[
          { label: "Recent", value: "recent" },
          { label: "Recipient", value: "phone" },
          { label: "Workspace", value: "workspace" },
        ]}
        currentSort={list.sort}
        onSortChange={list.setSort}
        right={<AdminLimitSelect limit={list.limit} setLimit={list.setLimit} />}
      />

      {list.error ? <Alert variant="danger">{list.error}</Alert> : null}

      {list.loading && !list.items.length ? (
        <TableSkeleton cols={8} rows={10} />
      ) : (
        <>
          <AdminTable
            columns={[
              { key: "phone", label: "Recipient" },
              { key: "direction", label: "Dir" },
              { key: "status", label: "Status" },
              { key: "workspace", label: "Context" },
              { key: "text", label: "Message Preview" },
              { key: "created", label: "Timestamp" },
            ]}
          >
            {list.items.length ? (
              list.items.map((m: any) => (
                <tr key={m.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="size-10 rounded-[5px] bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                          <MessageSquare size={18} />
                       </div>
                       <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                             <AdminTruncate text={m.phone || "No Phone"} max={20} />
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">WAID: {m.whatsappMessageId?.slice(-12) || "N/A"}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {m.direction === 'outbound' ? (
                      <div className="flex items-center gap-1.5 text-blue-600 font-black text-[10px] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-[4px] border border-blue-100">
                         <ArrowUpRight size={10} /> OUT
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-purple-600 font-black text-[10px] uppercase tracking-widest bg-purple-50 px-2 py-0.5 rounded-[4px] border border-purple-100">
                         <ArrowDownLeft size={10} /> IN
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest border",
                      m.status === 'delivered' || m.status === 'read' || m.status === 'sent' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      m.status === 'failed' ? "bg-red-50 text-red-700 border-red-100" :
                      "bg-amber-50 text-amber-700 border-amber-100"
                    )}>
                      {m.status === 'read' || m.status === 'delivered' ? <CheckCircle2 size={10} /> : m.status === 'failed' ? <AlertCircle size={10} /> : <Clock size={10} />}
                      {m.status || "PENDING"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Briefcase size={12} className="text-slate-400" />
                          <AdminTruncate text={m.workspace?.name || "N/A"} max={20} />
                       </div>
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                          <Megaphone size={10} className="text-slate-300" />
                          <AdminTruncate text={m.campaign?.name || "Direct Message"} max={20} />
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[11px] font-medium text-slate-600 italic bg-slate-50 p-2 rounded-[5px] border border-slate-100 max-w-xs truncate">
                       <AdminTruncate text={m.text || "No content"} max={100} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar size={12} className="text-slate-400" />
                      {m.createdAt ? new Date(m.createdAt).toLocaleString() : "N/A"}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={6}>
                  No message logs found for this period.
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

