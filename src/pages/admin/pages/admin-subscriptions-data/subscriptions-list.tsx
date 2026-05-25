import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Badge } from "@components/ui/Badge";
import { AdminLimitSelect } from "@pages/admin/components/AdminLimitSelect";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { useAdminList } from "@pages/admin/hooks/useAdminList";
import { inr } from "./shared";

export function SubscriptionsList() {
  const [summary, setSummary] = useState<{ plan: string; count: number }[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const base = location.pathname.startsWith("/super-admin") ? "/super-admin/subscriptions-data" : "/admin/subscriptions-data";

  const fetcher = useCallback((params: { page: number; limit: number; q: string }) => API.admin.subscriptionsData(params).then((r: any) => {
    const data = r?.data || {};
    const pagination = data?.pagination || {};
    setSummary(Array.isArray(data?.summary) ? data.summary : []);
    return { items: data?.items || [], total: Number(pagination.total || 0), page: Number(pagination.page || params.page), limit: Number(pagination.limit || params.limit), totalPages: Number(pagination.totalPages || 1) };
  }), []);
  const list = useAdminList<any>({ fetcher, initialLimit: 25 });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar title="Subscription Data" subtitle="Workspace subscriptions with validity, payment, and entitlement details." query={list.query} setQuery={list.setQuery} onRefresh={list.refresh} isSyncing={list.loading} right={<AdminLimitSelect limit={list.limit} setLimit={list.setLimit} />} />
      {list.error ? <Alert variant="danger">{list.error}</Alert> : null}
      {summary.length ? <div className="flex flex-wrap gap-2">{summary.map((s) => <Badge key={s.plan} className="text-[10px] font-black uppercase tracking-widest">{s.plan}: {s.count}</Badge>)}</div> : null}
      {list.loading && !list.items.length ? <TableSkeleton cols={9} rows={10} /> : <>
        <AdminTable columns={[{ key: "workspace", label: "Workspace" }, { key: "workspaceId", label: "Workspace ID" }, { key: "owner", label: "Owner" }, { key: "plan", label: "Plan" }, { key: "status", label: "Subscription Status" }, { key: "purchased", label: "Purchased" }, { key: "validFrom", label: "Valid From" }, { key: "validUntil", label: "Valid Until" }, { key: "amount", label: "Amount" }]}>
          {list.items.length ? list.items.map((w: any) => {
            const sub = w.subscription || {};
            return <tr key={w.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`${base}/${w.id}`)}><td className="px-6 py-4 text-sm font-bold text-slate-900">{w.name}</td><td className="px-6 py-4 text-xs text-slate-600">{w.id}</td><td className="px-6 py-4 text-sm text-slate-700">{w.owner?.email || "-"}</td><td className="px-6 py-4 text-sm text-slate-700">{sub.planName || w.plan || "-"}</td><td className="px-6 py-4 text-xs font-black uppercase text-slate-600">{sub.subscriptionStatus || "-"}</td><td className="px-6 py-4 text-xs text-slate-600">{sub.purchasedAt ? new Date(sub.purchasedAt).toLocaleString() : "-"}</td><td className="px-6 py-4 text-xs text-slate-600">{sub.validFrom ? new Date(sub.validFrom).toLocaleDateString() : "-"}</td><td className="px-6 py-4 text-xs text-slate-600">{sub.validUntil ? new Date(sub.validUntil).toLocaleDateString() : "-"}</td><td className="px-6 py-4 text-sm text-slate-700">{inr(sub.payableAmountPaise)}</td></tr>;
          }) : <tr><td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={9}>No subscription data available.</td></tr>}
        </AdminTable>
        <AdminPagination page={list.page} totalPages={list.totalPages} total={list.total} onPageChange={list.setPage} />
      </>}
    </div>
  );
}
