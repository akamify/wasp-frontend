import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Spinner } from "../components/ui/Spinner";
import { Badge } from "../components/ui/Badge";
import { RefreshCw } from "lucide-react";
import { Input } from "../components/ui/Input";

type MetaStatus =
  | { status: "loading" }
  | { status: "disconnected"; credentials: null }
  | { status: "pending"; credentials: any }
  | { status: "active"; credentials: any };

function toneFor(status: MetaStatus["status"]) {
  if (status === "active") return "good";
  if (status === "pending") return "warn";
  return "bad";
}

export default function MetaConnectPage() {
  const [metaStatus, setMetaStatus] = useState<MetaStatus>({ status: "loading" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [graphApiVersion, setGraphApiVersion] = useState("v22.0");
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  const statusLabel = useMemo(() => {
    if (metaStatus.status === "loading") return "Loading";
    if (metaStatus.status === "active") return "Connected";
    if (metaStatus.status === "pending") return "Pending";
    return "Not connected";
  }, [metaStatus.status]);

  const loadStatus = useCallback(async () => {
    setError(null);
    try {
      const res = await API.meta.status();
      const status = res?.status;
      if (status === "active") setMetaStatus({ status: "active", credentials: res.credentials });
      else if (status === "pending") setMetaStatus({ status: "pending", credentials: res.credentials });
      else setMetaStatus({ status: "disconnected", credentials: null });
      if (res?.credentials?.graphApiVersion) setGraphApiVersion(String(res.credentials.graphApiVersion));
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to fetch Meta connection status");
      setMetaStatus({ status: "disconnected", credentials: null });
    }
  }, []);

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
    setError(null);
    setOk(null);
    try {
      if (overrideEnabled && overrideReason.trim().length < 10) {
        setError("Override reason must be at least 10 characters.");
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
      setOk("Credentials validated with Meta and saved successfully.");
      setAccessToken("");
      setOverrideEnabled(false);
      setOverrideReason("");
      await loadStatus();
    } catch (e: any) {
      const message =
        e?.response?.data?.details?.metaDebug?.meta?.error_user_msg ||
        e?.response?.data?.details?.metaDebug?.meta?.message ||
        e?.response?.data?.message ||
        "Failed to validate credentials";
      setError(message);
    } finally {
      setBusy(false);
    }
  }, [accessToken, phoneNumberId, wabaId, graphApiVersion, overrideEnabled, overrideReason, loadStatus]);

  return (
    <div className="grid gap-5">
      <section className="rounded-[5px] bg-blue-600 text-white shadow-[0_28px_110px_rgba(37,99,235,0.35)] overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="text-xs font-bold uppercase tracking-[0.28em] text-white/70">
            Manual WhatsApp Setup
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Add WABA and Phone Number IDs
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/85">
            Enter your Meta credentials manually. We validate IDs and API access before saving to your workspace.
          </p>

          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Badge tone={toneFor(metaStatus.status)}>{statusLabel}</Badge>
              {metaStatus.status === "active" && metaStatus.credentials?.lastValidatedAt ? (
                <span className="text-xs text-white/70">
                  Last verified: {new Date(metaStatus.credentials.lastValidatedAt).toLocaleString()}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
                onClick={loadStatus}
                disabled={busy}
              >
                <RefreshCw size={16} className={busy ? "animate-spin" : ""} /> Refresh
              </Button>
            </div>
          </div>
        </div>
      </section>

      {ok ? <Alert>{ok}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <Card className="p-6">
        {metaStatus.status === "loading" ? (
          <Spinner label="Checking Meta connection..." />
        ) : (
          <div className="grid gap-3 text-sm text-ink-900/70">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-ink-900/40">
              Connection details
            </div>
            <Alert tone="warn">
              One workspace can connect only <span className="font-semibold">one</span> WABA/Phone. Disconnect is disabled for safety.
              To change IDs later, enable <span className="font-semibold">Override</span> and provide a reason.
            </Alert>
            {metaStatus.status === "active" ? (
              <>
                <div>Graph API: {metaStatus.credentials?.graphApiVersion || "-"}</div>
                <div>WABA: {metaStatus.credentials?.businessAccountId || "-"}</div>
                <div>Phone Number ID: {metaStatus.credentials?.phoneNumberId || "-"}</div>
                <div>Validated at: {metaStatus.credentials?.lastValidatedAt ? new Date(metaStatus.credentials.lastValidatedAt).toLocaleString() : "-"}</div>
              </>
            ) : (
              <div>
                Status is <span className="font-semibold">{statusLabel}</span>. Add your credentials on the right to validate and activate this workspace.
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <form className="grid gap-4" onSubmit={onSave}>
          <Input
            label="Access Token"
            type="password"
            value={accessToken}
            onChange={(event) => setAccessToken(event.target.value)}
            required
            hint="Use a valid token with WhatsApp Cloud API permissions."
          />
          <Input
            label="Phone Number ID"
            value={phoneNumberId}
            onChange={(event) => setPhoneNumberId(event.target.value)}
            required
          />
          <Input
            label="WABA ID"
            value={wabaId}
            onChange={(event) => setWabaId(event.target.value)}
            required
          />
          <Input
            label="Graph API Version"
            value={graphApiVersion}
            onChange={(event) => setGraphApiVersion(event.target.value)}
            hint="Example: v22.0"
          />

          {metaStatus.status === "active" ? (
            <div className="rounded-[5px] border border-ink-900/10 bg-slate-50 p-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                <input
                  type="checkbox"
                  checked={overrideEnabled}
                  onChange={(e) => setOverrideEnabled(e.target.checked)}
                />
                Override (serious situations only)
              </label>
              <div className="mt-2 text-xs text-ink-900/60">
                Required only if you are changing WABA/Phone IDs. Token refresh is safe without override.
              </div>
              {overrideEnabled ? (
                <div className="mt-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink-900/40">
                    Override reason
                  </label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="mt-2 w-full rounded-[5px] border border-ink-900/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
                    rows={3}
                    placeholder="Example: Rotating WABA due to business migration..."
                  />
                </div>
              ) : null}
            </div>
          ) : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Validating..." : "Validate and Save"}
          </Button>
        </form>
      </Card>
      </div>
    </div>
  );
}
