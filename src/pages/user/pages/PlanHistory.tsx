import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { formatCurrencyFromPaise } from "@shared/config/currency";
import { RefreshCw } from "lucide-react";

function inr(paise?: number | null) {
  if (paise == null) return "-";
  return formatCurrencyFromPaise(paise, "INR");
}

function ist(value?: string | null) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true });
}

export default function PlanHistoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (nextPage = page, q = query) => {
    setLoading(true);
    setError("");
    try {
      const res: any = await API.billing.history({ page: nextPage, limit, q: q || undefined });
      const data = res?.data || {};
      const pg = data?.pagination || {};
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(pg.total || 0));
      setTotalPages(Number(pg.totalPages || 1));
      setPage(Number(pg.page || nextPage));
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [limit, page, query]);

  useEffect(() => {
    load(1, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink-900">Subscription Plan History</h1>
          <p className="mt-2 text-xs font-semibold text-ink-800/60 uppercase tracking-widest">All your plan records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate("/app/plan")}>Back to Plan</Button>
          <Button onClick={() => load(page, query)} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="ml-2">{loading ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </div>
      </div>

      <Card className="p-4 border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search plan / status / payment type"
            className="h-10 flex-1 min-w-[220px] rounded-[5px] border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-brand-500/40"
          />
          <Button onClick={() => load(1, query)} disabled={loading}>Search</Button>
        </div>
      </Card>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="space-y-3">
        {items.map((row) => (
          <Card
            key={row.id}
            className="p-4 border-slate-200 cursor-pointer hover:border-brand-300 transition-colors"
            onClick={() => setSelected(row)}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-black text-slate-900">{row.planName || row.planSlug || "-"}</div>
                <div className="text-xs text-slate-600 mt-1">
                  {ist(row.validFrom)} - {ist(row.validUntil)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black uppercase text-slate-500">{row.status || "-"}</div>
                <div className="text-xs text-slate-600 mt-1">{row.paymentType || "-"}</div>
              </div>
            </div>
          </Card>
        ))}
        {!loading && !items.length ? (
          <Card className="p-8 border-slate-200 text-sm font-semibold text-slate-500 text-center">No subscription history found.</Card>
        ) : null}
      </div>

      <AdminPagination page={page} totalPages={totalPages} total={total} onPageChange={(p) => load(p, query)} />

      {selected ? (
        <div className="fixed inset-0 z-[999] bg-slate-900/45 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[5px] border border-slate-200 bg-white p-5 md:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">Subscription History Detail</h3>
              <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <Info label="Plan Name" value={selected.planName || "-"} />
              <Info label="Plan Slug" value={selected.planSlug || "-"} />
              <Info label="Status" value={selected.status || "-"} />
              <Info label="Payment Type" value={selected.paymentType || "-"} />
              <Info label="Transaction ID" value={selected.transactionId || "-"} />
              <Info label="Duration" value={`${selected.durationMonths || "-"} month(s)`} />
              <Info label="Valid From (IST)" value={ist(selected.validFrom)} />
              <Info label="Valid Until (IST)" value={ist(selected.validUntil)} />
              <Info label="Created At (IST)" value={ist(selected.createdAt)} />
              <Info label="Auto Renew" value={selected.autoRenewEnabled ? "Enabled" : "Disabled"} />
              <Info label="Amount" value={inr(selected.amountPaidPaise)} />
              <Info label="GST" value={inr(selected.gstAmountPaise)} />
              <Info label="Payable" value={inr(selected.payableAmountPaise)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[5px] border border-slate-200 p-3">
      <div className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-800 break-all">{value}</div>
    </div>
  );
}
