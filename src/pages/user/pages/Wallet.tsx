import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";
import { Badge } from "@components/ui/Badge";
import { RechargeModal } from "@components/wallet/RechargeModal";
import { WalletSkeleton } from "@components/ui/Skeletons";
import { formatCurrencySafe } from "@shared/config/currency";
import { RefreshCw, History, Info, Plus } from "lucide-react";
import { cn } from "@shared/utils/cn";
import { useToast } from "@shared/providers/ToastContext";

function toneForType(type: string) {
  const t = String(type || "").toLowerCase();
  if (t === "credit") return "good";
  if (t === "debit" || t === "template_message_charge") return "bad";
  return "neutral";
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<{ balance: number; currency: string } | null>(null);
  const [tx, setTx] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [sort, setSort] = useState<"all" | "debited" | "credited" | "failed">("all");
  const isInitialLoad = useRef(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const isFirst = isInitialLoad.current;
    if (isFirst) setBusy(true);
    setSyncing(true);
    setErr(null);
    try {
      const [w, h] = await Promise.all([API.wallet.get(), API.wallet.history({ limit: 10 })]);
      setWallet(w.wallet);
      setTx(h.transactions || []);
      setCursor(h.nextCursor || null);
      if (!isFirst) toast("Wallet balance updated", "success");
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load wallet");
    } finally {
      setBusy(false);
      setSyncing(false);
      isInitialLoad.current = false;
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const balanceLabel = useMemo(() => {
    return formatCurrencySafe(Number(wallet?.balance ?? 0), wallet?.currency || undefined);
  }, [wallet?.balance, wallet?.currency]);

  const filteredTx = useMemo(() => {
    if (sort === "all") return tx;
    if (sort === "credited") return tx.filter((t) => t.type === "credit");
    if (sort === "debited") return tx.filter((t) => t.type === "debit" || t.type === "template_message_charge");
    if (sort === "failed") return tx.filter((t) => t.status === "failed" || t.error);
    return tx;
  }, [tx, sort]);

  async function loadMore() {
    if (!cursor) return;
    try {
      const h = await API.wallet.history({ limit: 10, cursor });
      const items = h.transactions || [];
      setTx((prev) => [...prev, ...items]);
      setCursor(h.nextCursor || null);
    } catch { }
  }

  if (busy && isInitialLoad.current) return (
    <div className="p-4 md:p-8">
      <WalletSkeleton />
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-8">
      {err ? <Alert tone="error">{err}</Alert> : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-ink-900">Wallet</h1>
          <p className="mt-2 text-sm font-semibold text-ink-800/60 uppercase tracking-widest">Manage your credits and billing</p>
        </div>
        <Button
          variant="ghost"
          onClick={load}
          disabled={busy || syncing}
          className="h-10 border border-ink-900/10 bg-white gap-2 shadow-sm"
        >
          <RefreshCw size={16} className={cn(syncing && "animate-spin")} />
          {syncing ? "Syncing..." : "Refresh"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px] items-start">
        <div className="contents lg:order-1 lg:block lg:space-y-6">
          <Card className="order-1 relative overflow-hidden p-8 border-brand-200 bg-brand-50/30">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-12 -translate-y-12 rounded-full bg-brand-500/5 blur-3xl" />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600/60 mb-1">Available Credits</div>
                <div className="text-5xl font-black tracking-tighter text-ink-900">{balanceLabel}</div>
                <div className="mt-2 flex items-center gap-2 text-xs font-bold text-brand-600/80">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
                  Ready to send
                </div>
              </div>
              <Button
                onClick={() => setRechargeOpen(true)}
                className="h-14 px-5 text-lg font-black shadow-xl shadow-brand-500/20"
              >
              <Plus size={20} /> Buy Credits
              </Button>
            </div>
          </Card>

          <Card className="order-3 p-0 border-ink-900/5 shadow-xl shadow-ink-900/5 overflow-hidden lg:order-none">
            <div className="px-6 py-5 border-b border-ink-900/5 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-ink-800/60">Transaction history</h2>
              <Badge tone="neutral" className="rounded-[3px] text-[10px]">{filteredTx.length} total</Badge>
            </div>

            <div className="flex items-center justify-center p-4 border-b border-ink-900/5 bg-slate-50/50">
              <div className="flex items-center gap-1 m-1 p-1 bg-slate-50 border border-ink-900/5 rounded-[5px]">
                {(["all", "debited", "credited", "failed"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setSort(f)}
                    className={`rounded-[3px] px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${sort === f
                      ? "bg-white text-ink-900 shadow-sm shadow-ink-900/10 ring-1 ring-ink-900/5"
                      : "text-ink-800/40 hover:text-ink-900"
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-ink-800/40 border-b border-ink-900/5">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Transaction Details</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-900/5">
                  {filteredTx.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-ink-800/40 font-semibold italic">
                        No transactions found yet
                      </td>
                    </tr>
                  ) : (
                    filteredTx.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <Badge tone={toneForType(t.type)} className="rounded-[3px] py-1 px-2 uppercase font-black tracking-tighter">
                            {t.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-ink-900 leading-tight">
                            {t.reason || (t.type === "credit" ? "Account Recharge" : "Campaign Debit")}
                          </div>
                          <div className="text-[10px] font-bold text-ink-800/40 uppercase tracking-widest mt-0.5">
                            ID: {t.id?.slice(-8)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-ink-800/60">
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          }) : "—"}
                        </td>
                        <td className={`px-6 py-4 text-right font-black tabular-nums ${t.type === 'credit' ? 'text-emerald-600' : 'text-ink-900'}`}>
                          {t.type === 'credit' ? '+' : '-'}{formatCurrencySafe(t.amount, t.currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-ink-900/5">
              {filteredTx.length === 0 ? (
                <div className="px-6 py-12 text-center text-ink-800/40 font-semibold italic">
                  No transactions found yet
                </div>
              ) : (
                filteredTx.map((t) => (
                  <div key={t.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-ink-900 leading-tight">
                          {t.reason || (t.type === "credit" ? "Account Recharge" : "Campaign Debit")}
                        </div>
                        <div className="mt-1 text-[10px] font-bold text-ink-800/40 uppercase tracking-widest">
                          ID: {t.id?.slice(-8)}
                        </div>
                      </div>
                      <Badge tone={toneForType(t.type)} className="shrink-0 rounded-[3px] py-1 px-2 uppercase font-black tracking-tighter">
                        {t.type}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold text-ink-800/60">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "-"}
                      </div>
                      <div className={`font-black tabular-nums ${t.type === 'credit' ? 'text-emerald-600' : 'text-ink-900'}`}>
                        {t.type === 'credit' ? '+' : '-'}{formatCurrencySafe(t.amount, t.currency)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cursor && (
              <div className="p-4 border-t border-ink-900/5 bg-slate-50/50 text-center">
                <Button variant="ghost" size="sm" onClick={loadMore} className="text-[11px] font-black uppercase tracking-widest">
                  Load more History
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="order-2 space-y-6 lg:sticky lg:top-4 lg:order-2">
          <Card className="p-6 border-ink-900/5 bg-slate-50 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-[5px] bg-white flex items-center justify-center text-ink-900 shadow-sm">
                <Info size={20} />
              </div>
              <h3 className="font-black tracking-tight text-ink-900">Billing Info</h3>
            </div>
            <p className="text-xs font-semibold text-ink-800/60 leading-relaxed">
              WaspAkamify credits are charged for accepted template messages according to category. Meta billing is separate and handled by the connected WhatsApp billing hub; service-window replies are not wallet charged.
            </p>
          </Card>

          <Card className="p-6 border-ink-900/5 bg-ink-900 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <History size={20} className="text-brand-400" />
              <h3 className="font-black text-black tracking-tight">Auto-Recharge</h3>
            </div>
            <p className="text-[11px] font-medium text-black/60 leading-relaxed mb-4">
              Keep your campaigns running smoothly. Low balance alerts will be sent to your registered email.
            </p>
            <Badge tone="neutral" className="bg-white/10 text-black border-none uppercase font-black tracking-widest text-[9px]">Feature coming soon</Badge>
          </Card>
        </div>
      </div>

      <RechargeModal
        open={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        onPaid={() => {
          setTimeout(() => load(), 3500);
        }}
      />
    </div>
  );
}
