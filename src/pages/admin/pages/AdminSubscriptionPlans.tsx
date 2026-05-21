import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { AdminLimitSelect } from "@pages/admin/components/AdminLimitSelect";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { AdminTruncate } from "@pages/admin/components/AdminTruncate";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { CreditCard, Hash, Layers, ArrowRight } from "lucide-react";
import { cn } from "@shared/utils/cn";

type PlanItem = { plan: string; count: number };

export default function AdminSubscriptionPlansPage() {
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    API.admin
      .subscriptionPlans()
      .then((r: any) => {
        if (!active) return;
        setItems(Array.isArray(r?.items) ? r.items : []);
      })
      .catch((e: any) => {
        if (!active) return;
        setError(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to load plans");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => String(i.plan || "").toLowerCase().includes(q));
  }, [items, query]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageItems = filtered.slice((safePage - 1) * limit, safePage * limit);

  useEffect(() => setPage(1), [query, limit]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar
        title="Subscription Plans"
        subtitle="Distribution of active subscription tiers and channel utilization across the platform."
        query={query}
        setQuery={setQuery}
        onRefresh={() => setRefreshKey((k) => k + 1)}
        isSyncing={loading}
        right={<AdminLimitSelect limit={limit} setLimit={setLimit} options={[10, 25, 50, 100]} />}
      />

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {loading && !items.length ? (
        <TableSkeleton cols={2} rows={8} />
      ) : (
        <>
          <AdminTable 
            columns={[
              { key: "plan", label: "Plan Tier" }, 
              { key: "count", label: "Total Active Channels" }
            ]}
          >
            {pageItems.length ? (
              pageItems.map((p) => (
                <tr key={p.plan} className="group hover:bg-slate-50/80 transition-all duration-200">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                       <div className="size-10 rounded-[5px] bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                          <Layers size={18} />
                       </div>
                       <div className="min-w-0">
                          <div className="text-sm font-black text-slate-900 uppercase tracking-tight">
                             {p.plan || "UNKNOWN PLAN"}
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subscription Tier</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 rounded-[4px] border border-brand-100">
                          <Hash size={12} className="opacity-50" />
                          <span className="text-sm font-black tracking-tight">{p.count}</span>
                       </div>
                       <div className="flex-1 h-1.5 max-w-[120px] bg-slate-100 rounded-full overflow-hidden hidden md:block">
                          <div 
                            className="h-full bg-brand-500 rounded-full" 
                            style={{ width: `${Math.min(100, (p.count / (items[0]?.count || 1)) * 100)}%` }}
                          />
                       </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={2}>
                  No active subscription tiers found.
                </td>
              </tr>
            )}
          </AdminTable>

          <AdminPagination page={safePage} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

