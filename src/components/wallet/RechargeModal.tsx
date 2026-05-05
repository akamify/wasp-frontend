import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CreditCard, IndianRupee } from "lucide-react";
import { API } from "../../api/api";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Alert } from "../ui/Alert";
import { loadRazorpay } from "../../utils/loadRazorpay";
import { BRAND_NAME } from "../../config/brand";

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value || 0);
}

export function RechargeModal({
  open,
  onClose,
  onPaid,
  defaultAmount = 500,
}: {
  open: boolean;
  onClose: () => void;
  onPaid?: () => void;
  defaultAmount?: number;
}) {
  const [amount, setAmount] = useState(String(defaultAmount));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const parsedAmount = useMemo(() => Number(amount || 0), [amount]);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;

  async function start() {
    setErr(null);
    setOk(null);
    if (!validAmount) {
      setErr("Enter a valid amount.");
      return;
    }
    setBusy(true);
    try {
      const orderRes = await API.wallet.createRechargeOrder({ amount: parsedAmount });

      await loadRazorpay().catch(() => null);
      if (!window.Razorpay) {
        setOk(`Order created: ${orderRes.order.id}. Open this in a Razorpay-enabled browser to pay.`);
        return;
      }

      const rzp = new window.Razorpay({
        key: orderRes.keyId,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: BRAND_NAME,
        description: "Buy credits",
        order_id: orderRes.order.id,
        handler: () => {
          setOk("Payment received. Wallet will be updated.");
          onPaid?.();
        },
        modal: {
          ondismiss: () => {
            setOk("Checkout closed. If payment succeeded, wallet will update shortly.");
          },
        },
      });

      rzp.open();
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Recharge failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="mx-auto my-8 w-full max-w-lg overflow-hidden rounded-[5px] bg-white shadow-none ring-1 ring-ink-900/10"
            initial={{ y: 14, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 14, opacity: 0, scale: 0.98 }}
          >
            <div className="flex items-center justify-between border-b border-ink-900/10 px-5 py-4">
              <div>
                <div className="text-xs font-semibold text-ink-800/60">Wallet</div>
                <div className="text-lg font-black tracking-tight">Buy Credits</div>
              </div>
              <button
                onClick={onClose}
                className="rounded-[5px] p-2 text-ink-900/60 hover:bg-ink-900/5 hover:text-ink-900"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-5">
              <div className="rounded-[5px] bg-brand-50 p-4 ring-1 ring-brand-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-ink-900">Top up amount</div>
                  <div className="text-xs font-semibold text-ink-900/60">INR</div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <Input
                    label="Amount"
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="500"
                  />
                  <Button onClick={start} disabled={busy || !validAmount} className="h-[42px]">
                    <CreditCard size={16} />
                    <span className="ml-2">{busy ? "Creating order..." : "Pay now"}</span>
                  </Button>
                </div>
                <div className="mt-2 text-xs font-semibold text-ink-900/60">
                  You pay {formatINR(validAmount ? parsedAmount : 0)}. Credits appear after payment capture.
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[199, 499, 999].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className="cursor-pointer rounded-[5px] bg-white px-3 py-2 text-sm font-black text-ink-900 ring-1 ring-ink-900/12 hover:bg-ink-900/5"
                  >
                    <IndianRupee size={14} className="inline-block -mt-0.5" /> {v}
                  </button>
                ))}
              </div>

              {err ? (
                <div className="mt-4">
                  <Alert tone="error">{err}</Alert>
                </div>
              ) : null}
              {ok ? (
                <div className="mt-4">
                  <Alert tone="success">{ok}</Alert>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
