import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Card } from "@components/ui/Card";
import { AdminLimitSelect } from "@pages/admin/components/AdminLimitSelect";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { AdminTruncate } from "@pages/admin/components/AdminTruncate";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { AdminBarChart, AdminLineChart, AdminChartLabels } from "@pages/admin/components/AdminMiniChart";
import { BarChart3, TrendingUp, CheckCircle2, Eye, Calendar, ArrowRight, MessageSquare } from "lucide-react";
import { cn } from "@shared/utils/cn";

type Row = { date: string; count: number };

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(25);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [range, setRange] = useState<"today" | "week" | "30d">("30d");

  const [overview, setOverview] = useState<any>(null);
  const [daily, setDaily] = useState<Row[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    API.admin
      .overview({ range })
      .then((r: any) => {
        if (!active) return;
        setOverview(r?.overview || null);
        setDaily(Array.isArray(r?.dailyMessages) ? r.dailyMessages : []);
      })
      .catch((e: any) => {
        if (!active) return;
        setError(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to load analytics");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey, range]);

  const chartPoints = useMemo(() => {
    const pts = (daily || []).map((d) => ({ label: String(d.date || ""), count: Number(d.count || 0) }));
    if (range === "today") return pts.slice(-24);
    if (range === "30d") return pts.slice(-30);
    return pts.slice(-7);
  }, [daily, range]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return daily;
    return daily.filter((r) => String(r.date).toLowerCase().includes(q));
  }, [daily, query]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageItems = filtered.slice((safePage - 1) * limit, safePage * limit);

  useEffect(() => setPage(1), [query, limit]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar
        title="Traffic Analytics"
        subtitle="Today / last 7 days / last 30 days message volume with delivery overview."
        query={query}
        setQuery={setQuery}
        onRefresh={() => setRefreshKey((k) => k + 1)}
        isSyncing={loading}
        right={<AdminLimitSelect limit={limit} setLimit={setLimit} options={[7, 10, 25, 50]} />}
      />

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard 
          label="Total Outbound" 
          value={overview?.outboundMessages} 
          icon={<MessageSquare size={20} />} 
          loading={loading}
          color="blue"
        />
        <StatCard 
          label="Delivered Rate" 
          value={overview?.deliveredMessages} 
          icon={<CheckCircle2 size={20} />} 
          loading={loading}
          color="emerald"
        />
        <StatCard 
          label="Read Rate" 
          value={overview?.readMessages} 
          icon={<Eye size={20} />} 
          loading={loading}
          color="purple"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="h-4 w-1 bg-brand-500 rounded-full" />
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Volume Trend</h3>
        </div>

        <div className="flex bg-slate-100 rounded-[5px] p-1 w-fit">
          {[
            { key: "today", label: "Today" },
            { key: "week", label: "Last 7 Days" },
            { key: "30d", label: "30 Days" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setRange(f.key as any)}
              className={cn(
                "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[5px] transition-all",
                range === f.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="rounded-[5px] border border-slate-200 bg-white p-6 shadow-sm">
          {chartPoints.length ? (
            <>
              <AdminLineChart points={chartPoints} height={140} />
              <AdminChartLabels points={range === '30d' ? chartPoints.filter((_, i) => i % 5 === 0) : chartPoints} />
            </>
          ) : (
            <div className="text-xs font-semibold text-slate-400">No data.</div>
          )}
        </div>

        {loading && !daily.length ? (
          <TableSkeleton cols={2} rows={7} />
        ) : (
          <>
            <AdminTable
              columns={[
                { key: "date", label: range === "today" ? "Hour" : "Date" },
                { key: "count", label: "Outbound Messages" },
              ]}
            >
              {pageItems.length ? (
                pageItems.map((r) => (
                  <tr key={r.date} className="group hover:bg-slate-50/80 transition-all duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="size-9 rounded-[5px] bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                            <Calendar size={16} />
                         </div>
                         <div className="text-sm font-bold text-slate-900">
                            {r.date}
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                         <div className="px-3 py-1 bg-slate-100 text-slate-700 rounded-[4px] text-sm font-black tracking-tight min-w-[80px] text-center">
                            {r.count?.toLocaleString()}
                         </div>
                         <div className="flex-1 h-1.5 max-w-[200px] bg-slate-100 rounded-full overflow-hidden hidden md:block">
                            <div 
                              className="h-full bg-brand-500 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, (r.count / (Math.max(...daily.map(d => d.count)) || 1)) * 100)}%` }}
                            />
                         </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={2}>
                    No analytics data available for this range.
                  </td>
                </tr>
              )}
            </AdminTable>

            <AdminPagination page={safePage} totalPages={totalPages} total={total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, loading, color }: { label: string, value: any, icon: React.ReactNode, loading: boolean, color: 'blue' | 'emerald' | 'purple' }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100"
  };

  return (
    <div className="bg-white p-6 rounded-[5px] border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className={cn("absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300", colors[color].split(' ')[1])}>
        {icon}
      </div>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{label}</div>
      <div className="text-3xl font-black text-slate-900 tracking-tighter">
        {loading ? (
          <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-[5px]" />
        ) : (
          Number(value || 0).toLocaleString()
        )}
      </div>
      <div className="mt-4 flex items-center gap-1.5">
         <div className={cn("size-6 rounded-[4px] flex items-center justify-center border", colors[color])}>
            {icon}
         </div>
         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Traffic Data</span>
      </div>
    </div>
  );
}
