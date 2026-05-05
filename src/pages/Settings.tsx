import { useEffect, useState } from "react";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Alert } from "../components/ui/Alert";
import { useAuth } from "../context/AuthContext";
import { BRAND_NAME } from "../config/brand";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export default function SettingsPage() {
  const { user, refreshMe } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [walletBusy, setWalletBusy] = useState(false);
  const [wallet, setWallet] = useState<{ balance: number; currency: string } | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState("500");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletOk, setWalletOk] = useState<string | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileOk, setProfileOk] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const webhookUrl = `${API.baseUrl}/webhooks/whatsapp`;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  async function loadWallet() {
    try {
      const res = await API.wallet.get();
      setWallet(res.wallet);
    } catch {}
  }

  useEffect(() => {
    loadWallet();
  }, []);

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
  }, [user?.name, user?.phone]);

  async function rotate() {
    if (!confirm("Rotate API key? Existing key will stop working.")) return;
    setBusy(true);
    try {
      const res = await API.auth.rotateApiKey();
      setApiKey(res.apiKey);
    } finally {
      setBusy(false);
    }
  }

  async function startRecharge() {
    setWalletBusy(true);
    setWalletError(null);
    setWalletOk(null);
    try {
      const amount = Number(rechargeAmount || 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a valid recharge amount");
      }

      const orderRes = await API.wallet.createRechargeOrder({ amount });

      if (!window.Razorpay) {
        setWalletOk(`Order created: ${orderRes.order.id}. Complete payment from Razorpay-enabled browser.`);
        return;
      }

      const razorpay = new window.Razorpay({
        key: orderRes.keyId,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: BRAND_NAME,
        description: "Wallet Recharge",
        order_id: orderRes.order.id,
        handler: () => {
          setWalletOk("Payment received. Wallet will update once webhook confirms capture.");
          setTimeout(() => loadWallet(), 4000);
        },
        modal: {
          ondismiss: () => {
            setWalletOk("Recharge popup closed. If payment succeeded, wallet will update shortly.");
          },
        },
      });

      razorpay.open();
    } catch (e: any) {
      setWalletError(e?.response?.data?.message || e?.message || "Recharge failed");
    } finally {
      setWalletBusy(false);
    }
  }

  async function saveProfile() {
    setProfileBusy(true);
    setProfileError(null);
    setProfileOk(null);
    try {
      const res = await API.auth.updateProfile({ name, phone });
      setProfileOk("Profile updated.");
      await refreshMe();
      setName(res?.user?.name || name);
      setPhone(res?.user?.phone || phone);
      setTimeout(() => setProfileOk(null), 3000);
    } catch (e: any) {
      setProfileError(e?.response?.data?.message || e?.message || "Failed to update profile");
      setTimeout(() => setProfileError(null), 4000);
    } finally {
      setProfileBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-[5px] bg-white/60 p-6 ring-1 ring-ink-900/10 backdrop-blur">
        <div className="text-xs font-semibold text-ink-800/60">Tenant</div>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-ink-800/70">
          API key rotation + webhook URL quick reference.
        </p>
      </div>

      <Card className="p-6">
        <div className="text-lg font-black tracking-tight">User Profile</div>
        <div className="mt-2 text-sm text-ink-800/70">This is your platform account (not WhatsApp manager).</div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
          />
          <Input
            label="Phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone number"
          />
          <Input label="Email" value={user?.email || ""} disabled placeholder="Email" />
          <div className="flex items-end">
            <Button onClick={saveProfile} disabled={profileBusy}>
              {profileBusy ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </div>

        {profileError ? (
          <div className="mt-3">
            <Alert tone="error">{profileError}</Alert>
          </div>
        ) : null}
        {profileOk ? (
          <div className="mt-3">
            <Alert tone="success">{profileOk}</Alert>
          </div>
        ) : null}
      </Card>

      <Card className="p-6">
        <div className="text-lg font-black tracking-tight">Webhook URL</div>
        <div className="mt-2 break-all rounded-[5px] bg-white/70 px-3 py-2 text-sm font-semibold ring-1 ring-ink-900/10">
          {webhookUrl}
        </div>
        <div className="mt-3 text-sm text-ink-800/70">
          Meta verification hits GET with hub params. Events come via POST.
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-lg font-black tracking-tight">Wallet</div>
        <div className="mt-2 text-sm text-ink-800/70">
          Current balance:{" "}
          <span className="font-semibold">
            {wallet?.currency || "INR"} {wallet?.balance ?? 0}
          </span>
        </div>
        <div className="mt-2 text-sm text-ink-800/70">
          For full history and recharges, use the Wallet page.
        </div>
        <div className="mt-3">
          <Button variant="ghost" onClick={() => (window.location.href = "/app/wallet")}>
            Open Wallet
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[180px_auto] sm:items-end">
          <Input
            label="Recharge amount"
            type="number"
            min={1}
            value={rechargeAmount}
            onChange={(event) => setRechargeAmount(event.target.value)}
          />
          <Button onClick={startRecharge} disabled={walletBusy}>
            {walletBusy ? "Creating order..." : "Recharge wallet"}
          </Button>
        </div>

        {walletError ? <div className="mt-3"><Alert tone="error">{walletError}</Alert></div> : null}
        {walletOk ? <div className="mt-3"><Alert tone="success">{walletOk}</Alert></div> : null}
      </Card>

      <Card className="p-6">
        <div className="text-lg font-black tracking-tight">Automation API key</div>
        <div className="mt-2 text-sm text-ink-800/70">
          Use this key in your client app: <span className="font-semibold">X-API-Key</span>.
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="danger" onClick={rotate} disabled={busy}>
            {busy ? "Rotating..." : "Rotate key"}
          </Button>
          {apiKey ? (
            <Button variant="ghost" onClick={() => navigator.clipboard.writeText(apiKey)}>
              Copy new key
            </Button>
          ) : null}
        </div>

        {apiKey ? (
          <div className="mt-4 break-all rounded-[5px] bg-brand-50 px-3 py-2 text-sm font-semibold text-ink-900 ring-1 ring-brand-200">
            {apiKey}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
