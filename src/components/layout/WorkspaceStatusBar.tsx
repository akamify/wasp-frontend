import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock, ShieldAlert, Zap, Wallet, ChevronDown } from "lucide-react";
import { API } from "@api/api";
import { useAuth } from "@shared/providers/AuthContext";
import { cn } from "@shared/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { formatCurrencySafe } from "@shared/config/currency";

type MetaStatus = "loading" | "active" | "pending" | "disconnected";
type LiveState = "checking" | "live" | "pending" | "disconnected" | "rejected";

function labelFor(state: LiveState) {
  if (state === "live") return "Live";
  if (state === "pending") return "Pending";
  if (state === "rejected") return "Rejected";
  if (state === "disconnected") return "Disconnected";
  return "Checking";
}

export function WorkspaceStatusBar({ className }: { className?: string }) {
  const { workspace } = useAuth();
  const [metaStatus, setMetaStatus] = useState<MetaStatus>("loading");
  const [messagingTierRaw, setMessagingTierRaw] = useState<string | null>(null);
  const [limit24h, setLimit24h] = useState<number | null>(null);
  const [nextLimit, setNextLimit] = useState<number | null>(null);
  const [issuesCount, setIssuesCount] = useState<number>(0);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>("INR");
  const [showDropdown, setShowDropdown] = useState(false);
  const [metaDebugHint, setMetaDebugHint] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const tierLabel = useMemo(() => {
    const raw = String(messagingTierRaw || "").trim();
    if (!raw) return null;
    const upper = raw.toUpperCase();
    return upper.includes("TIER_") ? upper.replace(/^.*TIER_/, "Tier ").replace(/_/g, " ") : raw;
  }, [messagingTierRaw]);

  const liveState = useMemo<LiveState>(() => {
    if (metaStatus === "loading") return "checking";
    if (metaStatus === "disconnected") return "disconnected";
    if (metaStatus === "pending") return "pending";
    return "live";
  }, [metaStatus]);

  const refresh = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        API.meta.status(),
        API.meta.subscriptionHealth(),
        API.wallet.get()
      ]);
      if (!mountedRef.current) return;

      const statusRes = results[0].status === "fulfilled" ? results[0].value : null;
      const healthRes = results[1].status === "fulfilled" ? results[1].value : null;
      const walletRes = results[2].status === "fulfilled" ? results[2].value : null;
      const wallet = walletRes?.wallet || null;

      const st = String(statusRes?.status || "").toLowerCase();
      if (st === "active" || st === "pending" || st === "disconnected") {
        setMetaStatus(st);
      } else {
        setMetaStatus((current) => (current === "loading" ? "pending" : current));
      }

      setMessagingTierRaw(statusRes?.limits?.messagingLimitTier ? String(statusRes.limits.messagingLimitTier) : null);
      setLimit24h(typeof statusRes?.limits?.messagingLimitCurrent === "number" ? statusRes.limits.messagingLimitCurrent : null);
      setNextLimit(typeof statusRes?.limits?.messagingLimitNext === "number" ? statusRes.limits.messagingLimitNext : null);
      const statusError =
        results[0].status === "rejected"
          ? results[0].reason?.response?.data?.message || results[0].reason?.message || "Status check failed"
          : null;
      setMetaDebugHint(statusRes?.debugHint ? String(statusRes.debugHint) : statusError);

      setIssuesCount(Array.isArray(healthRes?.issues) ? healthRes.issues.length : 0);
      setBalance(wallet?.balance != null ? Number(wallet.balance) : null);
      setCurrency(wallet?.currency ? String(wallet.currency) : "INR");
      setLastCheckedAt(Date.now());
    } catch {
      if (!mountedRef.current) return;
      setMetaStatus("disconnected");
      setLastCheckedAt(Date.now());
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    const t = setInterval(refresh, 60000);
    return () => {
      mountedRef.current = false;
      clearInterval(t);
    };
  }, [refresh]);

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* Wallet Balance */}
      <Link to="/app/wallet" className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-[5px] transition-all hover:bg-brand-100/50 cursor-pointer">
        <div className="p-1 bg-brand-600 rounded-[5px] text-white">
          <Wallet size={12} />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-tighter">Balance</span>
          <span className="text-xs font-black text-slate-900">{formatCurrencySafe(Number(balance ?? 0), currency)}</span>
        </div>
      </Link>

      {/* API Status Badge */}
      <div 
        className="relative group flex items-center gap-2 cursor-pointer"
        onMouseEnter={() => setShowDropdown(true)}
        onMouseLeave={() => setShowDropdown(false)}
      >
        <div className="flex flex-col items-end leading-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">WABA Status</span>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "size-2 rounded-full animate-pulse",
              liveState === "live" ? "bg-emerald-500" : liveState === "pending" ? "bg-amber-500" : "bg-rose-500"
            )} />
            <span className="text-xs font-black text-slate-700 capitalize">{labelFor(liveState)}</span>
          </div>
        </div>
        <ChevronDown size={14} className={cn("text-slate-400 transition-transform", showDropdown && "rotate-180")} />

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded-[5px] p-4 z-50 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 blur-2xl rounded-[5px]" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Technical Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Tier</span>
                  <span className="text-xs font-bold text-slate-900">{tierLabel || "-"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">24h Limit</span>
                  <span className="text-xs font-bold text-slate-900">{limit24h != null ? limit24h.toLocaleString() : "-"}</span>
                </div>
                {nextLimit != null && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Next Tier</span>
                    <span className="text-xs font-bold text-slate-900">{nextLimit.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Plan</span>
                  <span className="text-xs font-bold text-brand-600">{workspace?.plan || "Free"}</span>
                </div>
                
                {issuesCount > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-100 rounded-[5px]">
                    <ShieldAlert size={14} className="text-rose-600" />
                    <span className="text-[10px] font-bold text-rose-700">{issuesCount} issues detected</span>
                  </div>
                )}

                {metaDebugHint ? (
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-[5px]">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Meta hint</div>
                    <div className="mt-1 text-[10px] font-bold text-slate-700 leading-relaxed">{metaDebugHint}</div>
                  </div>
                ) : null}

                <div className="pt-2 mt-2 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-medium uppercase tracking-tighter">
                    <Clock size={10} />
                    Last Checked {lastCheckedAt ? new Date(lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                  </div>
                  <button 
                    onClick={() => refresh()}
                    className="p-1 hover:bg-slate-100 rounded-[5px] text-brand-600 transition-colors"
                    title="Force Refresh"
                  >
                    <Zap size={12} fill="currentColor" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
