import { useCallback, useMemo, useState } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { AdminLimitSelect } from "@pages/admin/components/AdminLimitSelect";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { AdminTruncate } from "@pages/admin/components/AdminTruncate";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { useAdminList } from "@pages/admin/hooks/useAdminList";
import { Briefcase, User, Calendar, CreditCard } from "lucide-react";
import { cn } from "@shared/utils/cn";

type Item = any;

export default function AdminSubscriptionsDataPage() {
  const [summary, setSummary] = useState<{ plan: string; count: number }[]>([]);
  const [showTestData, setShowTestData] = useState(false);
  const fetcher = useCallback(
    (params: { page: number; limit: number; q: string }) =>
      API.admin.subscriptionsData(params).then((r: any) => {
        setSummary(Array.isArray(r.summary) ? r.summary : []);
        return {
          items: r.items || [],
          total: Number(r.total || 0),
          page: Number(r.page || params.page),
          limit: Number(r.limit || params.limit),
          totalPages: Number(r.totalPages || 1),
        };
      }),
    []
  );

  const list = useAdminList<Item>({ fetcher, initialLimit: 25 });

  const filteredItems = useMemo(() => {
    if (showTestData) return list.items;
    return (list.items || []).filter((w: any) => {
      const name = String(w?.name || "").toLowerCase();
      const ownerEmail = String(w?.owner?.email || "").toLowerCase();
      if (name.includes("smoke test") || name.includes("e2e") || name.includes("legacy")) return false;
      if (ownerEmail.includes("smoke+") || ownerEmail.includes("legacy+") || ownerEmail.includes("e2e+")) return false;
      if (ownerEmail.endsWith("@example.com")) return false;
      return true;
    });
  }, [list.items, showTestData]);

  const filteredSummary = useMemo(() => {
    if (showTestData) return summary;
    const counts = new Map<string, number>();
    filteredItems.forEach((w: any) => {
      const plan = String(w?.plan || "unknown");
      counts.set(plan, (counts.get(plan) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([plan, count]) => ({ plan, count }));
  }, [filteredItems, showTestData, summary]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar
        title="Subscription Data"
        subtitle="Detailed overview of all workspaces and their active subscription plans."
        query={list.query}
        setQuery={list.setQuery}
        onRefresh={list.refresh}
        isSyncing={list.loading}
        right={
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setShowTestData((v) => !v)}>
              {showTestData ? "Hide Test Data" : "Show Test Data"}
            </Button>
            <AdminLimitSelect limit={list.limit} setLimit={list.setLimit} />
          </div>
        }
      />

      {list.error ? <Alert variant="danger">{list.error}</Alert> : null}

      {filteredSummary.length ? (
        <div className="flex flex-wrap gap-2">
          {filteredSummary.map((s) => (
            <Badge key={s.plan} className="text-[10px] font-black uppercase tracking-widest">
              {s.plan}: {s.count}
            </Badge>
          ))}
        </div>
      ) : null}

      {list.loading && !filteredItems.length ? (
        <TableSkeleton cols={4} rows={10} />
      ) : (
        <>
          <AdminTable
            columns={[
              { key: "workspace", label: "Workspace" },
              { key: "plan", label: "Plan Type" },
              { key: "owner", label: "Workspace Owner" },
              { key: "created", label: "Created At" },
            ]}
          >
            {filteredItems.length ? (
              filteredItems.map((w: any) => (
                <tr key={w.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="size-10 rounded-[5px] bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                          <Briefcase size={18} />
                       </div>
                       <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                             <AdminTruncate text={w.name} max={40} />
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID: {w.id?.slice(-8)}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] text-[10px] font-black uppercase tracking-widest border transition-all",
                      w.plan === 'ENTERPRISE' ? "bg-purple-50 text-purple-700 border-purple-100" : 
                      w.plan === 'PRO' ? "bg-brand-50 text-brand-700 border-brand-100" :
                      "bg-slate-100 text-slate-600 border-slate-200"
                    )}>
                      <CreditCard size={10} />
                      {w.plan || "FREE"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="size-7 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200">
                          <User size={12} className="text-slate-400" />
                       </div>
                       <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-700 truncate">
                            <AdminTruncate text={w.owner?.email || "Unknown"} max={35} />
                          </div>
                          {w.owner?.name && <div className="text-[10px] font-medium text-slate-400 truncate">{w.owner.name}</div>}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-400" />
                      {w.createdAt ? new Date(w.createdAt).toLocaleDateString() : "N/A"}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={4}>
                  No subscription data available.
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
