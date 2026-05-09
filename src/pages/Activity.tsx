import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API } from "../api/api";
import { Search, ArrowUpRight, MessageSquare, Clock, Smartphone, RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ActivityListSkeleton } from "../components/ui/Skeletons";
import { cn } from "../utils/cn";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { extractMetaDebugFields, formatMetaDebugInline, isMetaBillingEligibilityPaymentIssue } from "../utils/metaErrors";

function stripUrls(text: string) {
  return String(text || "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstString(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return firstString(value[0]);
  if (typeof value === "object") {
    if (typeof value.providerError === "string") return value.providerError;
    if (typeof value.message === "string") return value.message;
    if (typeof value.title === "string") return value.title;
  }
  return String(value || "");
}

function extractFirstUrl(text: string) {
  const m = String(text || "").match(/https?:\/\/\S+/i);
  return m ? m[0] : "";
}

function summarizeActivityError(rawError: any) {
  const err = Array.isArray(rawError) ? rawError[0] : rawError;
  const rawMessage =
    firstString(err) ||
    String(err?.metaDebug?.meta?.error_user_msg || err?.metaDebug?.meta?.message || err?.error_data?.details || "");

  const lower = rawMessage.toLowerCase();
  const debug = formatMetaDebugInline(extractMetaDebugFields(err));

  const href =
    (typeof err?.href === "string" && err.href) ||
    extractFirstUrl(String(err?.error_data?.details || "")) ||
    extractFirstUrl(rawMessage) ||
    "";

  if (lower.includes("no payment method is set up") || lower.includes("billing_hub") || lower.includes("add_pm")) {
    return {
      title: "Payment setup required",
      description:
        "Your WhatsApp Business Account needs a payment method in Meta to send paid template messages.",
      href,
      debug,
    };
  }

  if (isMetaBillingEligibilityPaymentIssue(rawMessage)) {
    return {
      title: "Meta eligibility / billing issue",
      description:
        "Meta has blocked template messaging due to business eligibility or payment status. Complete billing setup/verification in Meta Business Manager.",
      href,
      debug,
    };
  }

  if (lower.includes("issue with the parameters") || (lower.includes("template") && lower.includes("parameter"))) {
    return {
      title: "Template parameters invalid",
      description:
        "Your template variables/buttons don’t match the approved template structure. Re-check placeholder counts and button values.",
      href: "",
      debug,
    };
  }

  return {
    title: "Send failed",
    description: stripUrls(rawMessage) || "An unknown error occurred during processing.",
    href: href || "",
    debug,
  };
}

export default function ActivityPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "desc");

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (busy) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [busy, hasMore]);

  const loadLogs = useCallback(async (isRefresh = false) => {
    const params = {
      page: isRefresh ? 1 : page,
      limit: 20,
      search: search || undefined,
      status: status === "all" ? undefined : status,
      sort,
    };

    if (isRefresh) {
      setSyncing(true);
      try {
        const res = await API.messages.logs(params);
        setLogs(Array.isArray(res.items) ? res.items : []);
        setPage(1);
        setHasMore((res.items?.length || 0) === 20);
      } catch (e) {
        console.error("Failed to refresh logs", e);
      } finally {
        setSyncing(false);
      }
      return;
    }

    setBusy(true);
    try {
      const res = await API.messages.logs(params);
      const newLogs = Array.isArray(res.items) ? res.items : [];
      setLogs(prev => page === 1 ? newLogs : [...prev, ...newLogs]);
      setHasMore(newLogs.length === 20);
    } catch (e) {
      console.error("Failed to load logs", e);
      setHasMore(false);
    } finally {
      setBusy(false);
      setInitialLoading(false);
    }
  }, [page, search, sort, status]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    setPage(1);
    setLogs([]);
    setHasMore(true);
    setInitialLoading(true);
    const next = new URLSearchParams();
    if (search) next.set("search", search);
    if (status !== "all") next.set("status", status);
    if (sort !== "desc") next.set("sort", sort);
    setSearchParams(next, { replace: true });
  }, [search, setSearchParams, sort, status]);

  function phoneFor(log: any) {
    return String(log?.phone || log?.to || "").trim();
  }

  function openActivityTarget(log: any) {
    const phone = phoneFor(log);
    if (phone) navigate(`/app/conversations/${phone}`);
  }



  if (initialLoading) return (
    <div className="p-4 md:p-8">
      <ActivityListSkeleton />
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-ink-900">Activity Log</h1>
          <p className="mt-2 text-sm font-semibold text-ink-800/60 uppercase tracking-widest">Global message audit trails</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-800/40" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID or phone..."
              className="h-10 w-full rounded-[5px] border border-ink-900/10 bg-white pl-10 pr-4 text-xs font-bold outline-none focus:border-brand-500/50 transition-all shadow-sm md:w-64"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-[5px] border border-ink-900/10 bg-white px-3 text-xs font-black uppercase tracking-wider text-ink-800/70 outline-none focus:border-brand-500/50"
          >
            <option value="all">All</option>
            <option value="accepted">Accepted</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="read">Read</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-[5px] border border-ink-900/10 bg-white px-3 text-xs font-black uppercase tracking-wider text-ink-800/70 outline-none focus:border-brand-500/50"
          >
            <option value="desc">Newest</option>
            <option value="asc">Oldest</option>
          </select>
          <Button 
            variant="ghost" 
            onClick={() => loadLogs(true)} 
            disabled={busy || syncing}
            className="h-10 border border-ink-900/10 bg-white gap-2 shadow-sm px-4"
          >
            <RefreshCw size={16} className={cn(syncing && "animate-spin")} />
            {syncing ? "Syncing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {logs.map((log, index) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index % 10) * 0.03 }}
            key={log._id}
            ref={index === logs.length - 1 ? lastElementRef : null}
            className="group relative rounded-[5px] border border-ink-900/5 bg-white p-5 shadow-sm hover:shadow-md transition-all hover:border-brand-500/20"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-[5px] transition-colors",
                  log.status === 'failed' ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-ink-900/40 group-hover:text-brand-600 group-hover:bg-brand-50"
                )}>
                  {log.status === 'failed' ? <ArrowUpRight size={22} className="rotate-90" /> : <MessageSquare size={22} />}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-ink-900">+{phoneFor(log) || "Unknown"}</span>
                    <div className={cn(
                      "rounded-[3px] border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest",
                      log.status === 'delivered' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      log.status === 'read' ? "bg-blue-50 text-blue-700 border-blue-100" :
                      log.status === 'failed' ? "bg-rose-50 text-rose-700 border-rose-100" :
                      "bg-slate-50 text-slate-600 border-slate-200"
                    )}>
                      {log.status}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink-800/40 uppercase tracking-wider">
                      <Clock size={10} />
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="h-1 w-1 rounded-full bg-ink-900/10" />
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink-800/40 uppercase tracking-wider">
                      <Smartphone size={10} />
                      {log.type || 'Manual'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] font-black uppercase tracking-widest text-ink-800/30">WA ID</div>
                  <div className="text-xs font-bold text-ink-900/60 tabular-nums">{log.whatsappMessageId?.slice(-12) || '—'}</div>
                </div>
                <div className="h-8 w-px bg-ink-900/5" />
                <button
                  onClick={() => openActivityTarget(log)}
                  disabled={!phoneFor(log)}
                  className="rounded-[5px] p-2 text-ink-900/20 hover:bg-slate-50 hover:text-ink-900 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  title="Open conversation"
                >
                  <ArrowUpRight size={18} />
                </button>
              </div>
            </div>

            {log.status === 'failed' && log.error && (
              <div className="mt-3 overflow-hidden rounded-[5px] border border-rose-200 bg-rose-50/40">
                <div className="flex items-start gap-3 p-3">
                  <div className="mt-0.5 flex-shrink-0 text-rose-600">
                    <AlertCircle size={14} />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="text-[10px] font-black uppercase tracking-widest text-rose-800">
                      {summarizeActivityError(log.error).title}
                    </div>
                    <div className="text-xs font-semibold leading-relaxed text-rose-700/90">
                      {summarizeActivityError(log.error).description}
                    </div>
                    {(() => {
                      const summary = summarizeActivityError(log.error);
                      if (summary.debug) {
                        return <div className="text-[10px] font-bold text-rose-700/70">{summary.debug}</div>;
                      }
                      return null;
                    })()}
                    {/* {(() => {
                      const summary = summarizeActivityError(log.error);
                      if (!summary.href) return null;
                      return (
                        <a
                          href={summary.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-[9px] font-black uppercase tracking-tighter text-white transition-colors hover:bg-rose-700"
                        >
                          Fix in Meta <ExternalLink size={10} />
                        </a>
                      );
                    })()} */}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}

        <AnimatePresence>
          {busy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-8"
            >
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </motion.div>
          )}
        </AnimatePresence>

        {!hasMore && logs.length > 0 && (
          <div className="py-12 text-center text-xs font-bold uppercase tracking-[0.2em] text-ink-800/20">
            End of activity trail
          </div>
        )}

        {!busy && logs.length === 0 && (
          <Card className="p-16 flex flex-col items-center text-center bg-slate-50/50 border-ink-900/5">
            <div className="p-6 bg-white rounded-[5px] text-ink-900/10 mb-6 shadow-sm">
              <Smartphone size={48} />
            </div>
            <h3 className="text-xl font-black text-ink-900">No Activity Yet</h3>
            <p className="mt-2 text-sm font-semibold text-ink-800/40 max-w-xs uppercase tracking-wider leading-relaxed">
              Global messages and system events will appear here.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
