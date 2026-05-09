import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import type { FormEvent } from "react";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { MetaConnectionSkeleton } from "../components/ui/Skeletons";
import { useToast } from "../context/ToastContext";
import { RefreshCw, ShieldCheck, HelpCircle, ArrowRight, Zap } from "lucide-react";
import { Input } from "../components/ui/Input";
import { cn } from "../utils/cn";
import { Link } from "react-router-dom";

type MetaStatus =
  | { status: "loading" }
  | { status: "disconnected"; credentials: null }
  | { status: "pending"; credentials: any }
  | { status: "active"; credentials: any };



export default function MetaConnectPage() {
  const [metaStatus, setMetaStatus] = useState<MetaStatus>({ status: "loading" });
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [graphApiVersion, setGraphApiVersion] = useState("v22.0");
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const isInitialLoad = useRef(true);

  const statusLabel = useMemo(() => {
    if (metaStatus.status === "loading") return "Loading";
    if (metaStatus.status === "active") return "Connected";
    if (metaStatus.status === "pending") return "Pending Verification";
    return "Disconnected";
  }, [metaStatus.status]);

  const loadStatus = useCallback(async () => {
    if (isInitialLoad.current) {
       // keep initial loading
    } else {
       setSyncing(true);
    }
    try {
      const res = await API.meta.status();
      const status = res?.status;
      if (status === "active") setMetaStatus({ status: "active", credentials: res.credentials });
      else if (status === "pending") setMetaStatus({ status: "pending", credentials: res.credentials });
      else setMetaStatus({ status: "disconnected", credentials: null });
      if (res?.credentials?.graphApiVersion) setGraphApiVersion(String(res.credentials.graphApiVersion));
      if (!isInitialLoad.current) toast("Connection status updated", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to fetch Meta connection status", "error");
      setMetaStatus({ status: "disconnected", credentials: null });
    } finally {
      setSyncing(false);
      isInitialLoad.current = false;
    }
  }, [toast]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (metaStatus.status !== "pending") return;
    const t = setInterval(loadStatus, 5000);
    return () => clearInterval(t);
  }, [metaStatus.status, loadStatus]);

  const onSave = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (overrideEnabled && overrideReason.trim().length < 10) {
        toast("Override reason must be at least 10 characters.", "warning");
        setBusy(false);
        return;
      }
      await API.meta.save({
        accessToken: accessToken.trim(),
        phoneNumberId: phoneNumberId.trim(),
        wabaId: wabaId.trim(),
        graphApiVersion: graphApiVersion.trim() || "v22.0",
        override: overrideEnabled,
        overrideReason: overrideEnabled ? overrideReason.trim() : "",
      });
      toast("Credentials validated and saved successfully.", "success");
      setAccessToken("");
      setOverrideEnabled(false);
      setOverrideReason("");
      await loadStatus();
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to validate credentials", "error");
    } finally {
      setBusy(false);
    }
  }, [accessToken, phoneNumberId, wabaId, graphApiVersion, overrideEnabled, overrideReason, loadStatus]);

  return (
    <div className="space-y-8 pb-12 p-4 md:p-8">
      {/* Hero Section */}
      <section>
        <div className="flex items-center justify-between p-6 min-w-full border border-gray-200 rounded-[5px] bg-white shadow-sm">
          <div className="flex flex-col justify-start gap-5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Status</div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "size-3 rounded-full animate-pulse",
                metaStatus.status === "active" ? "bg-emerald-500" : metaStatus.status === "pending" ? "bg-amber-500" : "bg-rose-500"
              )} />
              <span className="text-lg font-black text-black">{statusLabel}</span>

            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-white border-gray-200 text-black hover:bg-gray-50 rounded-[5px]"
            onClick={loadStatus}
            disabled={busy || syncing}
          >
            <RefreshCw size={14} className={cn("mr-2", (busy || syncing) && "animate-spin")} />
            {syncing ? "Syncing..." : "Refresh Status"}
          </Button>
        </div>
      </section>


      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Left Column: Form */}
        <div className="space-y-6">
          <Card className="p-8 rounded-[5px]">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-[5px]">
                <Zap size={20} fill="currentColor" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Credentials Setup</h3>
            </div>

            <form className="space-y-6" onSubmit={onSave}>
              <Input
                label="Meta Access Token"
                type="password"
                value={accessToken}
                onChange={(event) => setAccessToken(event.target.value)}
                required
                placeholder="EAAB..."
                hint="Your Permanent System User Token or Temporary Access Token."
                className="rounded-[5px]"
              />

              <div className="grid gap-6 sm:grid-cols-2">
                <Input
                  label="Phone Number ID"
                  value={phoneNumberId}
                  onChange={(event) => setPhoneNumberId(event.target.value)}
                  required
                  placeholder="123456789012345"
                  className="rounded-[5px]"
                />
                <Input
                  label="WABA ID"
                  value={wabaId}
                  onChange={(event) => setWabaId(event.target.value)}
                  required
                  placeholder="123456789012345"
                  className="rounded-[5px]"
                />
              </div>

              <Input
                label="Graph API Version"
                value={graphApiVersion}
                onChange={(event) => setGraphApiVersion(event.target.value)}
                placeholder="v22.0"
                hint="Default is v22.0. Change only if Meta updates their API."
                className="rounded-[5px]"
              />

              {metaStatus.status === "active" && (
                <div className="rounded-[5px] border border-amber-100 bg-amber-50/50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="checkbox"
                      id="override"
                      checked={overrideEnabled}
                      onChange={(e) => setOverrideEnabled(e.target.checked)}
                      className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <label htmlFor="override" className="text-sm font-black text-slate-900">
                      Enable Credential Override
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed">
                    Override is only required if you are changing the Phone ID or WABA ID for this workspace.
                    Tokens can be refreshed without enabling override.
                  </p>
                  {overrideEnabled && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Override Reason</label>
                      <textarea
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="w-full rounded-[5px] border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        rows={3}
                        placeholder="Please explain why you are changing these IDs..."
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full py-4 text-base rounded-[5px]" disabled={busy}>
                {busy ? (
                  <><RefreshCw size={18} className="mr-2 animate-spin" /> Validating Credentials...</>
                ) : (
                  <><ShieldCheck size={18} className="mr-2" /> Activate Workspace</>
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Info/Help */}
        <div className="space-y-6">
          <Card className="p-8 bg-slate-50 border-slate-100 h-full rounded-[5px]">
              {metaStatus.status === "loading" ? (
              <MetaConnectionSkeleton />
            ) : (
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <HelpCircle size={16} className="text-brand-600" />
                    How to find IDs?
                  </h4>
                  <ul className="space-y-4">
                    {[
                      "Login to Meta App Dashboard",
                      "Go to WhatsApp > API Setup",
                      "Copy 'Phone Number ID' and 'WABA ID'",
                      "Generate token in 'System Users' section"
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="size-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0 mt-0.5">{i + 1}</div>
                        <span className="text-xs font-medium text-slate-600">{step}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="#" className="mt-6 inline-flex items-center text-xs font-bold text-brand-600 hover:gap-2 transition-all">
                    View Documentation <ArrowRight size={14} className="ml-1" />
                  </Link>
                </div>

                <div className="pt-8 border-t border-slate-200">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Integration Details</h4>
                  {metaStatus.status === "active" ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-xs text-slate-500 font-medium">Graph API</span>
                        <span className="text-xs font-bold text-slate-900">{metaStatus.credentials?.graphApiVersion || "v22.0"}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-xs text-slate-500 font-medium">Verified At</span>
                        <span className="text-xs font-bold text-slate-900">
                          {metaStatus.credentials?.lastValidatedAt ? new Date(metaStatus.credentials.lastValidatedAt).toLocaleDateString() : "Never"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-medium italic">
                      Integration details will appear once a connection is established.
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
