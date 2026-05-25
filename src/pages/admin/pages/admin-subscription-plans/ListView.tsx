import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { inr, statusColor } from "./shared";

export function ListView({ query, setQuery, loadList, loading, navigate, statusFilter, setStatusFilter, summary, error, items, confirmAction, setConfirmAction, confirmAndRunAction }: any) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar title="Subscription Plans" subtitle="Create plans manually and publish. No default plans are auto-created." query={query} setQuery={setQuery} onRefresh={loadList} isSyncing={loading} right={<Button onClick={() => navigate("/super-admin/subscription-plans/create")}>Create Plan</Button>} />
      <div className="flex items-center gap-2 flex-wrap">{[["", "All"], ["in_review", "In Review"], ["published", "Published"], ["disabled", "Disabled"]].map(([value, label]) => <Button key={value} variant={statusFilter === value ? "primary" : "outline"} onClick={() => setStatusFilter(value)}>{label}</Button>)}</div>
      {summary.length ? <div className="text-xs font-semibold text-slate-600 flex gap-3 flex-wrap">{summary.map(([k, v]: any) => <span key={k}>{k}: {v}</span>)}</div> : null}
      {error ? <Alert variant="danger">{error}</Alert> : null}
      <AdminTable columns={[{ key: "name", label: "Name" }, { key: "orig", label: "Original" }, { key: "disc", label: "Discounted" }, { key: "gst", label: "GST%" }, { key: "status", label: "Status" }, { key: "recommended", label: "Recommended" }, { key: "created", label: "Created" }]}>
        {items.length ? items.map((row: any) => <tr key={row.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/super-admin/subscription-plans/${row.id}`)}><td className="px-6 py-4 text-sm font-bold text-slate-900">{row.name}</td><td className="px-6 py-4 text-sm text-slate-700">{inr(row?.pricing?.originalPricePaise)}</td><td className="px-6 py-4 text-sm text-slate-700">{inr(row?.pricing?.discountedPricePaise)}</td><td className="px-6 py-4 text-sm text-slate-700">{row?.pricing?.gstPercent ?? "-"}</td><td className={`px-6 py-4 text-xs font-black uppercase ${statusColor(row.status)}`}>{row.status}</td><td className="px-6 py-4 text-xs font-semibold text-slate-700">{row.recommended ? "Yes" : "No"}</td><td className="px-6 py-4 text-xs text-slate-600">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}</td></tr>) : <tr><td className="px-6 py-16 text-center text-slate-500" colSpan={7}>No plans created yet.</td></tr>}
      </AdminTable>
      <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-600">WhatsApp/message charges are billed separately from wallet balance where applicable.</div>
      {confirmAction ? <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[5px] border border-slate-200 bg-white p-5 shadow-2xl"><h3 className="text-lg font-black text-slate-900">{confirmAction.action === "publish" ? "Confirm Publish" : "Confirm Disable"}</h3><p className="mt-2 text-sm font-semibold text-slate-600">{confirmAction.action === "publish" ? `Are you sure you want to publish "${confirmAction.name}"?` : `Are you sure you want to disable "${confirmAction.name}"?`}</p><div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button><Button onClick={() => void confirmAndRunAction()}>{confirmAction.action === "publish" ? "Yes, Publish" : "Yes, Disable"}</Button></div></div></div> : null}
    </div>
  );
}
