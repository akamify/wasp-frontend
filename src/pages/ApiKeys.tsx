import { useEffect, useState } from "react";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useToast } from "../context/ToastContext";
import { Copy, Eye, EyeOff, RefreshCw, Terminal, Globe, ShieldCheck } from "lucide-react";
import { ApiKeysSkeleton } from "../components/ui/Skeletons";

export default function ApiKeysPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [maskedKey, setMaskedKey] = useState<string>("");
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<"rotate" | "reveal" | "">("");
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await API.auth.apiKeyStatus();
        if (!alive) return;
        setHasApiKey(!!res?.hasApiKey);
        setMaskedKey(String(res?.maskedKey || ""));
      } catch (e: any) {
        if (!alive) return;
        // If Meta isn't connected yet, backend returns a 409 — reflect that as "not ready"
        setHasApiKey(false);
      } finally {
        if (alive) setInitialLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    const start = apiKey.slice(0, 4);
    const end = apiKey.slice(-3);
    setMaskedKey(`${start}***${end}`);
  }, [apiKey]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((v) => Math.max(0, v - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function requestOtp(purpose: "rotate" | "reveal") {
    setBusy(true);
    try {
      const res = await API.auth.requestApiKeyOtp({ purpose });
      setOtpPurpose(purpose);
      setOtp("");
      setResendCooldown(60);
      toast(String(res?.message || "OTP sent to your registered email."), "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || e?.message || "Failed to send OTP", "error");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    if (!otpPurpose) return;
    if (!/^\d{6}$/.test(otp)) {
      toast("Enter a valid 6-digit OTP.", "warning");
      return;
    }
    setBusy(true);
    try {
      const res = await API.auth.verifyApiKeyOtp({ purpose: otpPurpose, otp });
      setApiKey(res.apiKey);
      setHasApiKey(true);
      toast(String(res?.message || "Success"), "success");
      setOtpPurpose("");
      setOtp("");
      setResendCooldown(0);

      // Auto-hide after a short window (key should not stay visible forever).
      window.setTimeout(() => setApiKey(null), 20000);
    } catch (e: any) {
      toast(e?.response?.data?.message || e?.message || "OTP verification failed", "error");
    } finally {
      setBusy(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (apiKey) {
      setTimeout(() => setApiKey(null), 2000);
    }
  };

  const revealDisabled = busy || !hasApiKey || !!apiKey;
  const showMaskedKey = !apiKey && hasApiKey;

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="bg-white rounded-[5px] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand-50 rounded-[5px] text-brand-600">
              <Terminal size={20} />
            </div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Developer Tools</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">API Settings</h1>
          <p className="mt-2 text-slate-500 font-medium max-w-2xl leading-relaxed">
            Manage your authentication token and quick-start details for custom integrations.
          </p>
        </div>
        <div className="absolute top-0 right-0 p-8 text-slate-50/50 pointer-events-none">
          <ShieldCheck size={160} strokeWidth={1} />
        </div>
      </div>

      {initialLoading ? (
        <ApiKeysSkeleton />
      ) : (
        <div className="grid gap-8 lg:grid-cols-1">
          {/* API Key Card */}
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Authentication Key</h3>
                <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-tighter">X-API-KEY Header</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-[5px] text-slate-400">
                <ShieldCheck size={24} />
              </div>
            </div>

            <div className="flex-1">
              <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium">
                Use this key to authorize requests from your own applications. Keep it secure and never share it publicly.
              </p>

              {apiKey ? (
                <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="p-4 bg-emerald-50 rounded-[5px] border border-emerald-100 flex items-center justify-between gap-3">
                    <code className="text-emerald-700 font-black text-sm break-all">{apiKey}</code>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => copyToClipboard(apiKey)}
                        className="p-2 hover:bg-white rounded-[5px] transition-all text-emerald-600 shadow-sm border border-emerald-200"
                        title={copied ? "Copied" : "Copy"}
                      >
                        {copied ? <span className="text-[10px] font-black uppercase px-1">Copied</span> : <Copy size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setApiKey(null)}
                        className="p-2 hover:bg-white rounded-[5px] transition-all text-emerald-600 shadow-sm border border-emerald-200"
                        title="Hide"
                      >
                        <EyeOff size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-slate-50 rounded-[5px] border border-slate-100 border-dashed flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">API Key Hidden</p>
                    <code className="text-slate-500 font-black text-sm tracking-wider">
                      {showMaskedKey ? maskedKey : "****"}
                    </code>
                    <p className="mt-2 text-[10px] text-slate-400 font-medium">
                      {hasApiKey ? "Reveal (OTP) or regenerate (OTP) to create a new one." : "Generate (OTP) after Meta setup is complete."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => requestOtp("reveal")}
                    disabled={revealDisabled}
                    className="p-2 rounded-[5px] border border-slate-200 bg-white text-slate-600 hover:text-slate-900"
                    title="Reveal"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-auto">
              {otpPurpose ? (
                <div className="space-y-3">
                  <Input
                    label="Email OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                    placeholder="123456"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" disabled={busy} onClick={() => { setOtpPurpose(""); setOtp(""); }}>
                      Cancel
                    </Button>
                    <Button disabled={busy} onClick={verifyOtp}>
                      {busy ? "Verifying..." : "Verify"}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    disabled={busy || resendCooldown > 0}
                    onClick={() => requestOtp(otpPurpose)}
                    className="w-full"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">

                  <Button
                    onClick={() => {
                      if (hasApiKey && !confirm("Regenerate API key? The existing key will stop working immediately.")) return;
                      void requestOtp("rotate");
                    }}
                    disabled={busy}
                    className="h-14 rounded-[5px] bg-slate-900 hover:bg-black text-white gap-2"
                  >
                    <RefreshCw size={18} className={busy ? "animate-spin" : ""} />
                    {hasApiKey ? "Regenerate" : "Generate"}
                  </Button>
                </div>
              )}

              {apiKey ? null : null}
            </div>
          </Card>

          <Card className="p-6 border-none shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Quick Start</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Use your API key</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-[5px] text-slate-400">
                <Globe size={20} />
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500">Base URL</span>
                <span className="font-semibold text-slate-900 break-all text-right">{API.baseUrl}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500">Auth Header</span>
                <span className="font-semibold text-slate-900 text-right">X-API-KEY: your_key</span>
              </div>
              <div className="rounded-[5px] bg-slate-50 border border-slate-100 p-3 text-xs text-slate-700">
                <div className="font-bold text-slate-500 uppercase tracking-widest text-[10px] mb-2">Example</div>
                <pre className="whitespace-pre-wrap">{`curl -X POST \\
  ${API.baseUrl}/integrations/campaigns/send \\
  -H "X-API-KEY: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"to":"91XXXXXXXXXX","templateId":"TEMPLATE_ID","variables":["John"]}'`}</pre>
              </div>
              <p className="text-xs text-slate-500">
                Tip: Keep keys secret.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
