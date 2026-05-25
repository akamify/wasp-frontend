import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Select } from "@components/ui/Select";
import { useToast } from "@shared/providers/ToastContext";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ArrowUp, ArrowDown, X, AlertCircle, Check, Clock3, CheckCheck, RefreshCcw } from "lucide-react";

function truncate(value: any, max = 22) {
  const s = String(value ?? "");
  if (s.length <= max) return s;
  if (max <= 1) return s.slice(0, 1);
  return `${s.slice(0, max - 1)}…`;
}

function fmtDate(value: any) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function extractErrorMessage(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return extractErrorMessage(value[0]);
  return (
    value.providerError ||
    value.providerMessage ||
    value.message ||
    value.error?.message ||
    value.error_data?.details ||
    value.metaDebug?.meta?.error_user_msg ||
    value.metaDebug?.meta?.message ||
    value.metaDebug?.raw?.error?.error_data?.details ||
    value.metaDebug?.raw?.error?.message ||
    ""
  );
}

function buildErrorViewModel(value: any) {
  const message = extractErrorMessage(value) || "Message delivery failed.";
  const code =
    value?.providerCode ||
    value?.error?.code ||
    value?.metaDebug?.meta?.code ||
    value?.metaDebug?.raw?.error?.code ||
    "";
  const subcode =
    value?.providerSubcode ||
    value?.error?.error_subcode ||
    value?.metaDebug?.meta?.error_subcode ||
    value?.metaDebug?.raw?.error?.error_subcode ||
    "";
  const traceId =
    value?.traceId ||
    value?.metaDebug?.meta?.fbtrace_id ||
    value?.metaDebug?.raw?.error?.fbtrace_id ||
    "";

  let guidance = "Verify template status, phone number format, and campaign payload.";
  const normalized = message.toLowerCase();
  if (normalized.includes("rate") || normalized.includes("throttle")) {
    guidance = "Rate limit hit. Retry after some time or reduce request burst.";
  } else if (normalized.includes("template")) {
    guidance = "Template issue. Check template approval status and variable mapping.";
  } else if (normalized.includes("phone") || normalized.includes("recipient")) {
    guidance = "Recipient issue. Validate country code and WhatsApp-enabled number.";
  } else if (normalized.includes("auth") || normalized.includes("token") || normalized.includes("permission")) {
    guidance = "Authorization issue. Reconnect Meta account and verify permissions.";
  }

  return {
    message,
    code: [code, subcode].filter(Boolean).join(" / "),
    traceId: String(traceId || ""),
    guidance,
  };
}

function statusMeta(status: any, hasError: boolean) {
  const s = String(status || "").toLowerCase();
  if (hasError || s === "failed" || s === "timeout_unknown") {
    return { label: s || "failed", tone: "error" as const, Icon: AlertCircle };
  }
  if (s === "read") {
    return { label: s, tone: "good" as const, Icon: CheckCheck };
  }
  if (s === "delivered") {
    return { label: s, tone: "ok" as const, Icon: CheckCheck };
  }
  if (s === "sent" || s === "accepted") {
    return { label: s, tone: "progress" as const, Icon: Check };
  }
  return { label: s || "queued", tone: "pending" as const, Icon: Clock3 };
}

export default function ApiReportsPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailBusy, setDetailBusy] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);

  const params = useMemo(
    () => ({
      page,
      limit,
      sort,
      status: statusFilter,
      onlyApiCampaigns: "true",
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    }),
    [page, limit, sort, statusFilter, search, dateFrom, dateTo]
  );


  async function load() {
    setBusy(true);
    try {
      const res = await API.reports.apiMessages(params);
      setRows(Array.isArray(res?.items) ? res.items : []);
      setTotal(Number(res?.total || 0));
    } catch (e: any) {
      toast(e?.response?.data?.message || e?.message || "Failed to load API report", "error");
    } finally {
      setBusy(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [params]);

  const totalPages = Math.max(Math.ceil(total / limit) || 1, 1);

  async function openDetail(id: string) {
    setDetailOpen(true);
    setDetailBusy(true);
    setDetail(null);
    try {
      const res = await API.reports.apiMessage(id);
      setDetail(res?.item || null);
    } catch (e: any) {
      toast(e?.response?.data?.message || e?.message || "Failed to load details", "error");
    } finally {
      setDetailBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <Card className="p-8 border-none bg-slate-50 shadow-xl shadow-slate-200/50">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reports</div>
          <div className="mt-2 h-8 w-64 rounded bg-slate-100" />
          <div className="mt-6 h-40 rounded bg-slate-50" />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-8">
      <div className="bg-white rounded-[5px] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-xs font-bold text-brand-600 uppercase tracking-widest">Developer</div>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">API Report</h1>
          <p className="mt-2 text-slate-500 font-medium max-w-2xl leading-relaxed">
            Monitor API-triggered campaigns and delivery status. Click a row to view full details.
          </p>
        </div>
      </div>

      <Card className="p-2 md:p-6 border-none shadow-xl shadow-slate-200/50">
        <div className="flex items-start justify-between flex-col gap-4">
          <div className="lg:col-span-1 w-full">
            <Input
              label="Search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Phone, status, WA id, message text..."
              icon={<Search size={18} />}
            />
          </div>
          <div className="flex items-start flex-wrap md:items-center justify-between gap-1">
            <div className="flex items-center flex-wrap gap-1 p-1 bg-slate-50 border border-ink-900/5 rounded-[5px]">
              {["all", "queued", "accepted", "sent", "delivered", "read", "failed"].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`rounded-[3px] px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${statusFilter === f
                    ? "bg-white text-ink-900 shadow-sm shadow-ink-900/10 ring-1 ring-ink-900/5"
                    : "text-ink-800/40 hover:text-ink-900"
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-50 border border-ink-900/5 rounded-[5px]">
              {(["newest -- oldest", "oldest -- newest"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setSort(f === "newest -- oldest" ? "desc" : "asc")}
                  className={`rounded-[3px] px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${(f === "newest -- oldest" && sort === "desc") || (f === "oldest -- newest" && sort === "asc")
                    ? "bg-white text-ink-900 shadow-sm shadow-ink-900/10 ring-1 ring-ink-900/5"
                    : "text-ink-800/40 hover:text-ink-900"
                    }`}
                >
                  {f === "newest -- oldest" ? (<><ArrowDown size={14} className="inline -mt-[1px] mr-1" /> Newest</>) : (<><ArrowUp size={14} className="inline -mt-[1px] mr-1" /> Oldest</>)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-4 w-full lg:w-auto">
            <div className="lg:col-span-2">
              <Input
                label="From"
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              />
            </div>
            <div className="lg:col-span-2">
              <Input
                label="To"
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="text-sm font-black text-slate-900">
            Results <span className="text-slate-400">({total})</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={busy} onClick={() => void load()} className="gap-2">
              <RefreshCcw size={14} className={busy ? "animate-spin" : ""} />
              {busy ? "Refreshing..." : "Refresh"}
            </Button>
            <Select label="Rows" value={String(limit)} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left">
                <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">Time</th>
                <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">Campaign</th>
                <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">Template</th>
                <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">Mobile</th>
                <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">Message</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((r) => {
                const campaignName = r?.campaignName || "-";
                const templateName = r?.templateName || "-";
                const errMsg = extractErrorMessage(r?.error);
                const hasError = Boolean(errMsg);
                const statusInfo = statusMeta(r?.status, hasError);
                const summaryText = hasError
                  ? errMsg
                  : String(r?.providerStatusMessage || r?.statusMessage || "").trim() || "";
                return (
                  <tr
                    key={r._id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer"
                    onClick={() => void openDetail(String(r._id))}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-semibold">{fmtDate(r.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900" title={campaignName}>{truncate(campaignName, 24)}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{r?.campaignType || ""}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900" title={templateName}>{truncate(templateName, 24)}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{r?.templateCategory || ""}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700">{r.phone}</td>
                    <td className="px-6 py-4" title={summaryText || ""}>
                      <div className="flex items-start gap-2">
                        <span
                          className={
                            statusInfo.tone === "error"
                              ? "mt-[1px] text-rose-600"
                              : statusInfo.tone === "good"
                                ? "mt-[1px] text-emerald-600"
                                : statusInfo.tone === "ok"
                                  ? "mt-[1px] text-slate-600"
                                  : "mt-[1px] text-slate-500"
                          }
                        >
                          <statusInfo.Icon size={14} />
                        </span>
                        <div className="min-w-0">
                          <div
                            className={
                              statusInfo.tone === "error"
                                ? "text-[10px] font-black uppercase tracking-widest text-rose-600"
                                : "text-[10px] font-black uppercase tracking-widest text-slate-500"
                            }
                          >
                            {statusInfo.label}
                          </div>
                          <div className={statusInfo.tone === "error" ? "text-rose-700 font-semibold" : "text-slate-700"}>
                            {truncate(summaryText || "", 64)}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td className="px-6 py-10 text-center text-slate-500 font-semibold" colSpan={5}>
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100">
          <div className="text-xs font-bold text-slate-500">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={busy || page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
              Prev
            </Button>
            <Button variant="outline" disabled={busy || page >= totalPages} onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>
              Next
            </Button>
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {detailOpen ? (
          <motion.div
            className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setDetailOpen(false);
            }}
          >
            <motion.div
              className="mx-auto my-16 w-full max-w-3xl overflow-hidden rounded-[5px] bg-white shadow-2xl ring-1 ring-black/10"
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.98 }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">Message Details</div>
                  <div className="mt-1 text-lg font-black text-slate-900">{detail?.phone || "—"}</div>
                </div>
                <Button variant="ghost" onClick={() => setDetailOpen(false)}>
                  <X size={18} />
                </Button>
              </div>

              <div className="px-6 py-6 space-y-4">
                {detailBusy ? (
                  <div className="h-32 rounded bg-slate-50" />
                ) : detail ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[5px] bg-slate-50 p-4 ring-1 ring-slate-100">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign</div>
                        <div className="mt-1 font-bold text-slate-900" title={detail?.campaign?.name || ""}>
                          {detail?.campaign?.name || "—"}
                        </div>
                        <div className="mt-1 text-xs font-bold text-slate-900">{fmtDate(detail.createdAt)}</div>
                        <div className="mt-1 text-md font-black text-slate-900">{String(detail.status || "—").toUpperCase()}</div>
                      </div>
                      <div className="rounded-[5px] bg-slate-50 p-4 ring-1 ring-slate-100">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Template</div>
                        <div className="mt-1 font-bold text-slate-900" title={detail?.template?.name || ""}>
                          {detail?.template?.name || "—"}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-600">
                          {detail?.template?.category || "—"}
                        </div>
                      </div>
                    </div>

                    {detail.error ? (
                      (() => {
                        const errorView = buildErrorViewModel(detail.error);
                        return (
                          <div className="rounded-[5px] bg-rose-50 p-4 ring-1 ring-rose-200 space-y-3">
                            <div className="text-[10px] font-black uppercase tracking-widest text-rose-700">Delivery Error</div>
                            <div>
                              <div className="text-xs font-black uppercase tracking-widest text-rose-600">What happened</div>
                              <div className="mt-1 text-sm font-semibold text-rose-900">{errorView.message}</div>
                            </div>
                            {errorView.code ? (
                              <div>
                                <div className="text-xs font-black uppercase tracking-widest text-rose-600">Provider Code</div>
                                <div className="mt-1 text-sm font-semibold text-rose-900">{errorView.code}</div>
                              </div>
                            ) : null}
                            {errorView.traceId ? (
                              <div>
                                <div className="text-xs font-black uppercase tracking-widest text-rose-600">Trace ID</div>
                                <div className="mt-1 text-sm font-mono text-rose-900 break-all">{errorView.traceId}</div>
                              </div>
                            ) : null}
                            <div>
                              <div className="text-xs font-black uppercase tracking-widest text-rose-600">What to check</div>
                              <div className="mt-1 text-sm font-semibold text-rose-900">{errorView.guidance}</div>
                            </div>
                          </div>
                        );
                      })()
                    ) : null}
                  </>
                ) : (
                  <div className="text-sm font-semibold text-slate-600">No details available.</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
