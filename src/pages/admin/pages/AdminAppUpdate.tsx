import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Card } from "@components/ui/Card";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { AdminTruncate } from "@pages/admin/components/AdminTruncate";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { Server, Download, History, Calendar, CheckCircle2, ShieldCheck, Cpu } from "lucide-react";
import { cn } from "@shared/utils/cn";

type Row = { version: string; checkedAt: string };

export default function AdminAppUpdatePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<string>("v0.0.0");
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    API.admin
      .appUpdate()
      .then((r: any) => {
        if (!active) return;
        setVersion(String(r?.version || "v0.0.0"));
      })
      .catch((e: any) => {
        if (!active) return;
        setError(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to load app update info");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const rows = useMemo<Row[]>(() => [{ version, checkedAt: new Date().toISOString() }], [version]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.version.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar
        title="Software Lifecycle"
        subtitle="Manage platform versioning, deployment artifacts, and system update telemetry."
        query={query}
        setQuery={setQuery}
        onRefresh={() => setRefreshKey((k) => k + 1)}
        isSyncing={loading}
      />

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         <Card className="p-6 border-slate-200 shadow-sm flex items-center gap-5">
            <div className="size-14 rounded-[5px] bg-brand-50 flex items-center justify-center text-brand-600 border border-brand-100 shadow-inner">
               <Cpu size={24} strokeWidth={2.5} />
            </div>
            <div>
               <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Production Release</div>
               <div className="text-2xl font-black text-slate-900 tracking-tight leading-none flex items-center gap-2">
                  {loading ? "..." : version}
                  {!loading && <CheckCircle2 size={18} className="text-emerald-500" />}
               </div>
            </div>
         </Card>
         
         <Card className="p-6 border-slate-200 shadow-sm flex items-center gap-5">
            <div className="size-14 rounded-[5px] bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
               <ShieldCheck size={24} strokeWidth={2.5} />
            </div>
            <div>
               <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Update Policy</div>
               <div className="text-sm font-bold text-slate-700 tracking-tight uppercase tracking-widest">Automatic Rolling</div>
            </div>
         </Card>
      </div>

      <div className="flex items-center gap-2 mt-2">
         <div className="h-4 w-1 bg-brand-500 rounded-full" />
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <History size={12} /> System Check History
         </h3>
      </div>

      {loading && !filtered.length ? (
        <TableSkeleton cols={2} rows={5} />
      ) : (
        <>
          <AdminTable columns={[{ key: "version", label: "Deployment Tag" }, { key: "checkedAt", label: "Audit Timestamp" }]}>
            {filtered.length ? (
              filtered.map((r) => (
                <tr key={r.checkedAt} className="group hover:bg-slate-50/80 transition-all duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="size-8 rounded-[4px] bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                          <Download size={14} />
                       </div>
                       <div className="text-sm font-bold text-slate-900">
                          <AdminTruncate text={r.version} max={32} />
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar size={12} className="text-slate-400" />
                      {new Date(r.checkedAt).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={2}>
                  No deployment logs available.
                </td>
              </tr>
            )}
          </AdminTable>

          <AdminPagination page={1} totalPages={1} total={filtered.length} onPageChange={() => {}} />
        </>
      )}
    </div>
  );
}

