import { useCallback, useEffect, useMemo, useState } from "react";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { RechargeModal } from "../components/wallet/RechargeModal";

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value || 0);
}

function toneForType(type: string) {
  const t = String(type || "").toLowerCase();
  if (t === "credit") return "good";
  if (t === "debit") return "bad";
  return "neutral";
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<{ balance: number; currency: string } | null>(null);
  const [tx, setTx] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rechargeOpen, setRechargeOpen] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const [w, h] = await Promise.all([API.wallet.get(), API.wallet.history({ limit: 50 })]);
      setWallet(w.wallet);
      setTx(h.transactions || []);
      setCursor(h.nextCursor || null);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load wallet");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const balanceLabel = useMemo(() => {
    const cur = wallet?.currency || "INR";
    if (cur !== "INR") return `${cur} ${wallet?.balance ?? 0}`;
    return formatINR(wallet?.balance ?? 0);
  }, [wallet?.balance, wallet?.currency]);

  async function loadMore() {
    if (!cursor) return;
    try {
      const h = await API.wallet.history({ limit: 50, cursor });
      const items = h.transactions || [];
      setTx((prev) => [...prev, ...items]);
      setCursor(h.nextCursor || null);
    } catch {}
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-[5px] bg-white/60 p-6 ring-1 ring-ink-900/10 backdrop-blur">
        <div className="text-xs font-semibold text-ink-800/60">Billing</div>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Wallet</h1>
        <p className="mt-2 text-sm text-ink-800/70">
          Buy credits and track your usage with a complete transaction history.
        </p>
      </div>

      {err ? <Alert tone="error">{err}</Alert> : null}

      <div className="">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-ink-900/40">Balance</div>
              <div className="mt-1 text-3xl font-black tracking-tight">{balanceLabel}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={load} disabled={busy}>
                {busy ? "Refreshing..." : "Refresh"}
              </Button>
              <Button onClick={() => setRechargeOpen(true)}>Buy credits</Button>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-black tracking-tight">Transaction history</div>
            <div className="mt-3 overflow-y-auto rounded-[5px] ring-1 ring-ink-900/10">
              <table className="min-w-[720px] w-full text-left text-sm">
                <thead className="bg-ink-900/5 text-xs font-black uppercase tracking-widest text-ink-900/50">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-900/5 bg-white">
                  {tx.map((t) => (
                    <tr key={t.id} className="hover:bg-ink-900/[0.02]">
                      <td className="px-4 py-3">
                        <Badge tone={toneForType(t.type)}>{t.type}</Badge>
                      </td>
                      <td className="px-4 py-3 font-black">
                        {t.currency === "INR" ? formatINR(t.amount) : `${t.currency} ${t.amount}`}
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink-900/80">{t.reason}</td>
                      <td className="px-4 py-3 font-semibold text-ink-900/70">
                        {t.provider}
                        {t.providerRef ? <span className="block text-xs text-ink-900/40">{t.providerRef}</span> : null}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-ink-900/60">
                        {t.createdAt ? new Date(t.createdAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                  {!tx.length ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm font-semibold text-ink-900/50">
                        No transactions yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {cursor ? (
              <div className="mt-4">
                <Button variant="ghost" onClick={loadMore}>
                  Load more
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <RechargeModal
        open={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        onPaid={() => {
          // refresh after a short delay (webhook capture may take a moment)
          setTimeout(() => load(), 3500);
        }}
      />
    </div>
  );
}

