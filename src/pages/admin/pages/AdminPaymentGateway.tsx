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
import { CreditCard, ShieldCheck, Landmark, Globe, Activity, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@shared/utils/cn";

type Item = any;

export default function AdminPaymentGatewayPage() {
  const fetcher = useCallback(
    (params: { page: number; limit: number; q: string; filter?: string; sort?: string }) =>
      API.admin.paymentGateway(params).then((r: any) => ({
        items: r.gateways || [],
        total: (r.gateways || []).length,
        page: 1,
        limit: 100,
        totalPages: 1,
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
        title="Payment Orchestration"
        subtitle="Manage financial gateways, processing providers, and secure transaction endpoints."
        query={list.query}
        setQuery={list.setQuery}
        onRefresh={list.refresh}
        isSyncing={list.loading}
        filterOptions={[
          { label: "All Gateways", value: "all" },
          { label: "Live", value: "live" },
          { label: "Maintenance", value: "maintenance" },
          { label: "Offline", value: "offline" },
        ]}
        currentFilter={list.filter}
        onFilterChange={list.setFilter}
        sortOptions={[
          { label: "Default", value: "recent" },
          { label: "Uptime", value: "uptime" },
          { label: "Provider", value: "provider" },
        ]}
        currentSort={list.sort}
        onSortChange={list.setSort}
        right={<AdminLimitSelect limit={list.limit} setLimit={list.setLimit} />}
      />

      {list.error ? <Alert variant="danger">{list.error}</Alert> : null}

      {list.loading && !list.items.length ? (
        <TableSkeleton cols={3} rows={5} />
      ) : (
        <>
          <AdminTable columns={[{ key: "provider", label: "Processor" }, { key: "status", label: "Connectivity" }, { key: "notes", label: "Configuration Summary" }]}>
            {list.items.length ? (
              list.items.map((g: any) => (
                <tr key={g.id || g.provider} className="group hover:bg-slate-50/80 transition-all duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="size-10 rounded-[5px] bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors border border-slate-200 shadow-sm">
                          <Landmark size={18} />
                       </div>
                       <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                             <AdminTruncate text={g.provider} max={40} />
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Global Provider</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[10px] font-black uppercase tracking-widest border transition-all",
                      g.status === 'active' || g.status === 'live' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                      g.status === 'maintenance' ? "bg-amber-50 text-amber-700 border-amber-100" :
                      "bg-slate-100 text-slate-600 border-slate-200"
                    )}>
                      {g.status === 'active' || g.status === 'live' ? <CheckCircle2 size={10} /> : <Activity size={10} />}
                      {g.status || "STANDBY"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 max-w-[400px]">
                       <Info size={14} className="text-slate-300 shrink-0" />
                       <AdminTruncate text={g.notes || "No deployment notes available."} max={100} />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={3}>
                  No payment processors configured.
                </td>
              </tr>
            )}
          </AdminTable>

          <AdminPagination page={list.page} totalPages={list.totalPages} total={list.total} onPageChange={list.setPage} />
        </>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 mt-2">
         <div className="bg-slate-900 p-6 rounded-[5px] text-white flex items-center justify-between overflow-hidden relative group">
            <div className="relative z-10 space-y-1">
               <div className="text-[10px] font-black uppercase tracking-widest text-brand-400">Security Audit</div>
               <div className="text-lg font-black tracking-tight">PCI-DSS Level 1 Compliance</div>
               <p className="text-xs text-slate-400 font-medium max-w-[250px]">All payment gateways are audited monthly for data integrity.</p>
            </div>
            <ShieldCheck size={120} className="absolute -right-8 -bottom-8 text-white/5 group-hover:text-brand-500/10 transition-colors duration-500 rotate-12" />
         </div>
         
         <div className="bg-white p-6 rounded-[5px] border border-slate-200 flex items-center justify-between overflow-hidden relative group shadow-sm">
            <div className="relative z-10 space-y-1">
               <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Monitoring</div>
               <div className="text-lg font-black tracking-tight text-slate-900">99.99% Uptime Guarantee</div>
               <p className="text-xs text-slate-500 font-medium max-w-[250px]">Automatic failover between active payment providers enabled.</p>
            </div>
            <Globe size={120} className="absolute -right-8 -bottom-8 text-slate-100 group-hover:text-brand-100 transition-colors duration-500 -rotate-12" />
         </div>
      </div>
    </div>
  );
}

