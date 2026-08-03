import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";
import { Badge } from "@components/ui/Badge";
import { RechargeModal } from "@components/wallet/RechargeModal";
import { WalletSkeleton } from "@components/ui/Skeletons";
import { formatCurrencySafe } from "@shared/config/currency";
import {
  ArrowUpRight,
  Coins,
  History,
  Info,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { cn } from "@shared/utils/cn";
import { useToast } from "@shared/providers/ToastContext";

function toneForType(type: string) {
  const t = String(type || "").toLowerCase();
  if (t === "credit") return "good";
  if (t === "debit") return "bad";
  return "neutral";
}

function WalletHeroStat({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/10 p-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-white/60">{label}</div>
        <ArrowUpRight size={16} className="text-white/45" />
      </div>
      <div className="mt-3 text-2xl font-black text-white">{value}</div>
      {helper ? <div className="mt-2 text-xs font-semibold leading-5 text-slate-200/75">{helper}</div> : null}
    </div>
  );
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

  const balanceLabel = useMemo(() => formatCurrencySafe(Number(wallet?.balance ?? 0), wallet?.currency || undefined), [wallet?.balance, wallet?.currency]);
  const creditedCount = useMemo(() => tx.filter((t) => t.type === "credit").length, [tx]);
  const debitedCount = useMemo(() => tx.filter((t) => t.type === "debit").length, [tx]);
  const latestTransaction = tx[0] || null;

  const filteredTx = useMemo(() => {
    if (sort === "all") return tx;
    if (sort === "credited") return tx.filter((t) => t.type === "credit");
    if (sort === "debited") return tx.filter((t) => t.type === "debit");
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
    } catch {}
  }

  if (busy && isInitialLoad.current) {
    return (
      <div>
        <WalletSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.08),_transparent_24%),linear-gradient(180deg,_rgba(248,250,252,0.96),_rgba(255,255,255,1))] p-3">
      {err ? <Alert tone="error">{err}</Alert> : null}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="relative overflow-hidden border border-emerald-100/80 bg-[linear-gradient(135deg,_#081226_0%,_#15324d_58%,_#0f766e_100%)] p-6 text-white shadow-[0_30px_80px_-36px_rgba(8,18,38,0.75)] md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.18),_transparent_28%)]" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.26em] text-emerald-100">
                <Sparkles size={14} />
                Wallet Marketplace
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Wallet</h1>
                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-200/88 md:text-[15px]">
                  A premium balance surface for recharges, subscriptions, and add-on purchases with instant visibility and cleaner transaction tracking.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <WalletHeroStat label="Available balance" value={balanceLabel} helper="Spendable INR balance" />
              <WalletHeroStat label="Credit entries" value={String(creditedCount)} helper="Recharge and refund events" />
              <WalletHeroStat label="Debit entries" value={String(debitedCount)} helper="Subscriptions and add-ons" />
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="border border-white/80 bg-white/90 p-5 shadow-[0_22px_56px_-36px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Action center</div>
                <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">Recharge, review, and refresh with confidence</div>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  Keep payment balance ready for plans, campaigns, and AI add-ons from one polished wallet workspace.
                </p>
              </div>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
                Live balance
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button onClick={() => setRechargeOpen(true)} className="h-12 justify-center text-sm font-black shadow-lg shadow-emerald-500/20">
                <Plus size={18} />
                Add Wallet Balance
              </Button>
              <Button variant="outline" onClick={load} disabled={busy || syncing} className="h-12 justify-center border-slate-200 bg-white">
                <RefreshCw size={16} className={cn(syncing && "animate-spin")} />
                {syncing ? "Syncing..." : "Refresh"}
              </Button>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border border-white/80 bg-white/92 p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <WalletCards size={18} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Ready</span>
              </div>
              <div className="mt-4 text-2xl font-black text-slate-900">{balanceLabel}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">Current marketplace balance</div>
            </Card>

            <Card className="border border-white/80 bg-white/92 p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                  <History size={18} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Flow</span>
              </div>
              <div className="mt-4 text-2xl font-black text-slate-900">{String(tx.length)}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">Tracked wallet events</div>
            </Card>

            <Card className="border border-white/80 bg-white/92 p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                  <TrendingUp size={18} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Latest</span>
              </div>
              <div className="mt-4 text-lg font-black text-slate-900">{latestTransaction?.type ? String(latestTransaction.type).toUpperCase() : "NO ENTRY"}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">Most recent transaction type</div>
            </Card>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_350px]">
        <div className="contents lg:order-1 lg:block lg:space-y-6">
          <Card className="order-1 relative overflow-hidden border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,0.94))] p-8 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)]">
            <div className="absolute right-0 top-0 h-40 w-40 translate-x-16 -translate-y-16 rounded-full bg-emerald-500/8 blur-3xl" />
            <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/60">Available Wallet Balance</div>
                <div className="text-5xl font-black tracking-tighter text-ink-900">{balanceLabel}</div>
                <div className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-600/80">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Spendable instantly for recharges, subscriptions, and add-on purchases
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">Currency: {wallet?.currency || "INR"}</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">Entries tracked: {tx.length}</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">Credit events: {creditedCount}</span>
                </div>
              </div>
              <div className="grid gap-3 sm:min-w-[250px]">
                <div className="rounded-[18px] border border-slate-200/80 bg-white/90 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Latest movement</div>
                    <ArrowUpRight size={15} className="text-slate-300" />
                  </div>
                  <div className="mt-3 text-lg font-black text-slate-900">{latestTransaction?.reason || "No transaction yet"}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    {latestTransaction?.createdAt ? new Date(latestTransaction.createdAt).toLocaleString() : "Will appear after your first wallet event"}
                  </div>
                </div>
                <Button onClick={() => setRechargeOpen(true)} className="h-14 px-5 text-lg font-black shadow-xl shadow-emerald-500/20">
                  <Plus size={20} />
                  Add Wallet Balance
                </Button>
              </div>
            </div>
          </Card>

          <Card className="order-3 overflow-hidden border border-white/80 bg-white/95 p-0 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] lg:order-none">
            <div className="border-b border-ink-900/5 bg-[linear-gradient(180deg,_rgba(248,250,252,0.82),_rgba(255,255,255,1))] px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.24em] text-ink-800/60">Transaction history</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Review recharge, subscription, and add-on payment movements in one polished feed.</p>
                </div>
                <Badge tone="neutral" className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {filteredTx.length} total
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-center border-b border-ink-900/5 bg-slate-50/40 p-4">
              <div className="flex items-center gap-1 rounded-[14px] border border-ink-900/5 bg-white p-1 shadow-sm">
                {(["all", "debited", "credited", "failed"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setSort(f)}
                    className={`rounded-[10px] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${
                      sort === f ? "bg-slate-900 text-white shadow-sm shadow-ink-900/10" : "text-ink-800/40 hover:text-ink-900"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="border-b border-ink-900/5 bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.22em] text-ink-800/40">
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
                      <td colSpan={4} className="px-6 py-12 text-center font-semibold italic text-ink-800/40">
                        No transactions found yet
                      </td>
                    </tr>
                  ) : (
                    filteredTx.map((t) => (
                      <tr key={t.id} className="transition-colors hover:bg-slate-50/60">
                        <td className="px-6 py-4">
                          <Badge tone={toneForType(t.type)} className="rounded-full px-2.5 py-1 uppercase font-black tracking-[0.14em]">
                            {t.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold leading-tight text-ink-900">{t.reason || (t.type === "credit" ? "Account Recharge" : "Campaign Debit")}</div>
                          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-800/40">ID: {t.id?.slice(-8)}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-ink-800/60">
                          {t.createdAt
                            ? new Date(t.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className={`px-6 py-4 text-right font-black tabular-nums ${t.type === "credit" ? "text-emerald-600" : "text-ink-900"}`}>
                          {t.type === "credit" ? "+" : "-"}
                          {formatCurrencySafe(t.amount, t.currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-ink-900/5 md:hidden">
              {filteredTx.length === 0 ? (
                <div className="px-6 py-12 text-center font-semibold italic text-ink-800/40">No transactions found yet</div>
              ) : (
                filteredTx.map((t) => (
                  <div key={t.id} className="bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold leading-tight text-ink-900">{t.reason || (t.type === "credit" ? "Account Recharge" : "Campaign Debit")}</div>
                        <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-800/40">ID: {t.id?.slice(-8)}</div>
                      </div>
                      <Badge tone={toneForType(t.type)} className="shrink-0 rounded-full px-2.5 py-1 uppercase font-black tracking-[0.14em]">
                        {t.type}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold text-ink-800/60">
                        {t.createdAt
                          ? new Date(t.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </div>
                      <div className={`font-black tabular-nums ${t.type === "credit" ? "text-emerald-600" : "text-ink-900"}`}>
                        {t.type === "credit" ? "+" : "-"}
                        {formatCurrencySafe(t.amount, t.currency)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cursor ? (
              <div className="border-t border-ink-900/5 bg-slate-50/50 p-4 text-center">
                <Button variant="ghost" size="sm" onClick={loadMore} className="text-[11px] font-black uppercase tracking-[0.18em]">
                  Load more History
                </Button>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="order-2 space-y-6 lg:sticky lg:top-4 lg:order-2">
          <Card className="border border-white/80 bg-white/92 p-6 shadow-[0_18px_46px_-34px_rgba(15,23,42,0.4)] backdrop-blur">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-slate-50 text-ink-900 shadow-sm">
                <Info size={20} />
              </div>
              <h3 className="font-black tracking-tight text-ink-900">Billing Info</h3>
            </div>
            <p className="text-xs font-semibold leading-relaxed text-ink-800/60">
              Wallet balance is your INR payment source for recharges, subscriptions, and add-on purchases. AI runtime credits are purchased separately inside the AI module.
            </p>
            <div className="mt-4 rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                <ShieldCheck size={14} />
                Protected balance layer
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-600">Recharge balance stays separate from AI credit packs and remains your INR payment source.</div>
            </div>
          </Card>

          <Card className="overflow-hidden border border-slate-200 bg-[linear-gradient(135deg,_#ffffff,_#f8fafc_55%,_#ecfeff_100%)] p-6 shadow-[0_18px_46px_-34px_rgba(15,23,42,0.4)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-emerald-50 text-emerald-700 shadow-sm">
                <Coins size={18} />
              </div>
              <h3 className="font-black tracking-tight text-slate-900">Auto-Recharge</h3>
            </div>
            <p className="mb-4 text-[11px] font-medium leading-relaxed text-slate-600">
              Keep your campaigns running smoothly. Low balance alerts will be sent to your registered email.
            </p>
            <div className="grid gap-3">
              <div className="rounded-[14px] border border-slate-200 bg-white/80 px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Coming soon</div>
                <div className="mt-1 text-sm font-semibold text-slate-600">Automatic low-balance refill rules for subscriptions and campaigns.</div>
              </div>
              <Badge tone="neutral" className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                Feature coming soon
              </Badge>
            </div>
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
