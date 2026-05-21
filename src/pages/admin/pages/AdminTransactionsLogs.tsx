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
import { CreditCard, ArrowUpRight, ArrowDownLeft, Briefcase, User, Server, Calendar, Wallet } from "lucide-react";
import { cn } from "@shared/utils/cn";

type Item = any;

export default function AdminTransactionsLogsPage() {
  const fetcher = useCallback(
    (params: { page: number; limit: number; q: string; filter?: string; sort?: string }) =>
      API.admin.transactionsLogs(params).then((r: any) => ({
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
        title="Transaction Logs"
        subtitle="Global financial audit trail of all wallet recharges, deductions, and subscription payments."
        query={list.query}
        setQuery={list.setQuery}
        onRefresh={list.refresh}
        isSyncing={list.loading}
        filterOptions={[
          { label: "All Types", value: "all" },
          { label: "Credits", value: "credit" },
          { label: "Debits", value: "debit" },
        ]}
        currentFilter={list.filter}
        onFilterChange={list.setFilter}
        sortOptions={[
          { label: "Recent", value: "recent" },
          { label: "Oldest", value: "old" },
          { label: "Amount", value: "amount" },
        ]}
        currentSort={list.sort}
        onSortChange={list.setSort}
        right={<AdminLimitSelect limit={list.limit} setLimit={list.setLimit} />}
      />

      {list.error ? <Alert variant="danger">{list.error}</Alert> : null}

      {list.loading && !list.items.length ? (
        <TableSkeleton cols={7} rows={10} />
      ) : (
        <>
          <AdminTable
            columns={[
              { key: "type", label: "Type" },
              { key: "amount", label: "Amount" },
              { key: "reason", label: "Transaction Details" },
              { key: "workspace", label: "Workspace" },
              { key: "owner", label: "Billed To" },
              { key: "provider", label: "Provider" },
              { key: "created", label: "Timestamp" },
            ]}
          >
            {list.items.length ? (
              list.items.map((t: any) => (
                <tr key={t.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest border",
                      t.type === 'credit' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                      "bg-red-50 text-red-700 border-red-100"
                    )}>
                      {t.type === 'credit' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                      {t.type || "DEBIT"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                       <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                          <Wallet size={14} />
                       </div>
                       <span className="text-sm font-black text-slate-900">
                         {t.currency} {t.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[11px] font-bold text-slate-600 max-w-xs truncate">
                       <AdminTruncate text={t.reason || "No description provided"} max={60} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                       <Briefcase size={14} className="text-slate-400" />
                       <AdminTruncate text={t.workspace?.name || "N/A"} max={20} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                       <User size={14} className="text-slate-400" />
                       <AdminTruncate text={t.owner?.email || "Unknown"} max={30} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <Server size={10} />
                       {t.provider || "SYSTEM"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar size={12} className="text-slate-400" />
                      {t.createdAt ? new Date(t.createdAt).toLocaleString() : "N/A"}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={7}>
                  No transaction records found.
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

