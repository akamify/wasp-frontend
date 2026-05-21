import { useCallback, useMemo, useState } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { AdminLimitSelect } from "@pages/admin/components/AdminLimitSelect";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { AdminTruncate } from "@pages/admin/components/AdminTruncate";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { useAdminList } from "@pages/admin/hooks/useAdminList";
import { Briefcase, User, ShieldCheck, Calendar, CheckCircle2, XCircle } from "lucide-react";

type Item = any;

export default function AdminChannelsPage() {
  const [showTestData, setShowTestData] = useState(false);
  const fetcher = useCallback(
    (params: { page: number; limit: number; q: string }) =>
      API.admin.workspaces(params).then((r: any) => ({
        items: r.items || [],
        total: Number(r.total || 0),
        page: Number(r.page || params.page),
        limit: Number(r.limit || params.limit),
        totalPages: Number(r.totalPages || 1),
      })),
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

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar
        title="Workspaces"
        subtitle="Manage all customer environments, organization settings, and associated subscription tiers."
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

      {list.loading && !filteredItems.length ? (
        <TableSkeleton cols={5} rows={10} />
      ) : (
        <>
          <AdminTable
            columns={[
              { key: "name", label: "Workspace" },
              { key: "plan", label: "Plan Tier" },
              { key: "owner", label: "Account Owner" },
              { key: "status", label: "Status" },
              { key: "created", label: "Registered On" },
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
                             <AdminTruncate text={w.name} max={44} />
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID: {w.id?.slice(-8)}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-brand-50 text-brand-700 rounded-[4px] border border-brand-100 text-[10px] font-black uppercase tracking-widest">
                       <ShieldCheck size={10} />
                       {w.plan || "FREE"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <div className="text-xs font-bold text-slate-700 truncate max-w-[200px]">
                          <AdminTruncate text={w.owner?.email || "Unknown Owner"} max={42} />
                       </div>
                       <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                          <User size={10} /> {w.owner?.name || "N/A"}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {w.isActive ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                         <CheckCircle2 size={12} /> Active
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-black uppercase tracking-widest">
                         <XCircle size={12} /> Suspended
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar size={12} className="text-slate-400" />
                      {w.createdAt ? new Date(w.createdAt).toLocaleDateString() : "—"}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={5}>
                  No workspaces found.
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
