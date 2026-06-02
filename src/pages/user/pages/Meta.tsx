import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API, clearApiGetCache } from "@api/api";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { MetaConnectionSkeleton } from "@components/ui/Skeletons";
import { useToast } from "@shared/providers/ToastContext";
import { RefreshCw, HelpCircle, ArrowRight } from "lucide-react";
import { cn } from "@shared/utils/cn";
import { Link } from "react-router-dom";
import { loadMetaSdk } from "@shared/utils/metaSdk";

type MetaStatus =
  | { status: "loading"; credentials: null }
  | { status: "disconnected"; credentials: null }
  | { status: "pending"; credentials: any }
  | { status: "active"; credentials: any };

export default function MetaConnectPage() {
  const [metaStatus, setMetaStatus] = useState<MetaStatus>({ status: "loading", credentials: null });
  const [syncing, setSyncing] = useState(false);
  const [embeddedBusy, setEmbeddedBusy] = useState(false);
  const [embeddedError, setEmbeddedError] = useState("");
  const [embeddedDebugError, setEmbeddedDebugError] = useState("");
  const [embeddedPhones, setEmbeddedPhones] = useState<Array<{ id: string; display_phone_number: string | null }>>([]);
  const [embeddedConnection, setEmbeddedConnection] = useState<any>(null);
  const authCodeRef = useRef<string | null>(null);

  const signupDetailsRef = useRef<{ waba_id: string | null; phone_number_id: string | null }>({
    waba_id: null,
    phone_number_id: null,
  });
  const exchangeStartedRef = useRef(false);
  const signupActiveRef = useRef(false);
  const flowIdRef = useRef<string | null>(null);
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const isInitialLoad = useRef(true);
  const { toast } = useToast();

  const debug = (label: string, data: Record<string, unknown>) => {
    void label;
    void data;
  };

  const clearMessageListener = useCallback(() => {
    if (messageHandlerRef.current) {
      window.removeEventListener("message", messageHandlerRef.current);
      messageHandlerRef.current = null;
    }
  }, []);

  const statusLabel = useMemo(() => {
    if (metaStatus.status === "loading") return "Loading";
    if (metaStatus.status === "active") return "Connected";
    if (metaStatus.status === "pending") return "Pending";
    return "Disconnected";
  }, [metaStatus.status]);
  const isDisconnected = metaStatus.status === "disconnected" || !embeddedConnection?.connected;
  const isStatusLoading = syncing || embeddedBusy;

  const loadStatus = useCallback(async () => {
    if (!isInitialLoad.current) setSyncing(true);
    try {
      const [statusRes, connectionRes] = await Promise.all([API.meta.status(), API.meta.connection()]);
      const status = String(statusRes?.status || "disconnected");
      if (status === "active") setMetaStatus({ status: "active", credentials: statusRes.credentials || null });
      else if (status === "pending") setMetaStatus({ status: "pending", credentials: statusRes.credentials || null });
      else setMetaStatus({ status: "disconnected", credentials: null });
      setEmbeddedConnection(connectionRes || null);
      if (!isInitialLoad.current) toast("Connection status updated", "success");
    } catch (e: any) {
      setMetaStatus({ status: "disconnected", credentials: null });
      setEmbeddedConnection(null);
      toast(e?.response?.data?.message || "Failed to fetch WhatsApp connection status", "error");
    } finally {
      setSyncing(false);
      isInitialLoad.current = false;
    }
  }, [toast]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    return () => clearMessageListener();
  }, [clearMessageListener]);

  const connectWhatsApp = useCallback(async () => {
    setEmbeddedBusy(true);
    setEmbeddedError("");
    setEmbeddedDebugError("");
    setEmbeddedPhones([]);
    authCodeRef.current = null;
    exchangeStartedRef.current = false;
    signupActiveRef.current = true;
    flowIdRef.current = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    signupDetailsRef.current = { waba_id: null, phone_number_id: null };
    clearMessageListener();
    try {
      const env = (import.meta as any).env || {};
      const configId = String(
        env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID || env.VITE_META_EMBEDDED_SIGNUP_CONFIG_ID || ""
      ).trim();
      if (!configId) throw new Error("Missing META Embedded Signup Config ID env");

      const fb = await loadMetaSdk();

      const currentFlowId = flowIdRef.current;
      let exchangePromise: Promise<void> | null = null;
      const maybeCompleteSignup = async () => {
        if (!signupActiveRef.current) return;
        if (!currentFlowId || flowIdRef.current !== currentFlowId) return;
        if (exchangePromise) return exchangePromise;
        if (!authCodeRef.current) return;
        if (!signupDetailsRef.current.waba_id) return;

        exchangeStartedRef.current = true;
        debug("calling exchange", {
          hasCode: !!authCodeRef.current,
          hasWabaId: !!signupDetailsRef.current.waba_id,
          hasPhoneNumberId: !!signupDetailsRef.current.phone_number_id,
        });

        exchangePromise = (async () => {
          const result = await API.meta.embeddedSignupExchange({
            code: authCodeRef.current,
            waba_id: signupDetailsRef.current.waba_id,
            phone_number_id: signupDetailsRef.current.phone_number_id,
          });
          if (result?.needsPhoneSelection) {
            const phones = Array.isArray(result?.phones) ? result.phones : [];
            setEmbeddedPhones(phones);
            setEmbeddedError(result?.message || "Meta did not return a phone number. Please select a phone number and reconnect WhatsApp.");
            signupActiveRef.current = false;
            clearMessageListener();
            return;
          }
          await API.templates.refreshWhatsApp().catch((error: any) => {
            debug("template sync after connect failed", {
              message: error?.response?.data?.message || error?.message || "Unknown error",
            });
          });
          clearApiGetCache();
          toast("WhatsApp connected successfully", "success");
          signupActiveRef.current = false;
          clearMessageListener();
          await loadStatus();
        })();
        return exchangePromise;
      };

      const handler = (event: MessageEvent) => {
        const allowed = ["https://www.facebook.com", "https://web.facebook.com"];
        if (!allowed.includes(String(event.origin || ""))) return;
        if (!signupActiveRef.current || exchangeStartedRef.current) return;
        if (!currentFlowId || flowIdRef.current !== currentFlowId) return;
        try {
          const payload = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          if (!payload || payload.type !== "WA_EMBEDDED_SIGNUP") return;
          const currentEvent = String(payload.event || "").toUpperCase();
          if (currentEvent === "CANCEL") {
            setEmbeddedBusy(false);
            setEmbeddedError("Meta signup was cancelled");
            signupActiveRef.current = false;
            clearMessageListener();
            return;
          }
          if (currentEvent === "ERROR") {
            setEmbeddedBusy(false);
            setEmbeddedError("Meta embedded signup failed");
            signupActiveRef.current = false;
            clearMessageListener();
            return;
          }
          if (currentEvent !== "FINISH") return;
          const data = payload?.data && typeof payload.data === "object" ? payload.data : {};
          const wabaId = String(data?.waba_id || "").trim() || null;
          const phoneNumberId = String(data?.phone_number_id || "").trim() || null;
          debug("WA Embedded Signup FINISH received", {
            type: payload?.type || null,
            event: payload?.event || null,
            dataKeys: Object.keys(data || {}),
            hasWabaId: !!wabaId,
            hasPhoneNumberId: !!phoneNumberId,
          });
          if (!wabaId) {
            setEmbeddedError("Meta did not return a WABA ID. Please try again.");
            signupActiveRef.current = false;
            clearMessageListener();
            return;
          }
          const session = { waba_id: wabaId, phone_number_id: phoneNumberId };
          signupDetailsRef.current = session;
          void maybeCompleteSignup().catch(() => { });
        } catch {
          // ignore malformed payloads
        }
      };
      messageHandlerRef.current = handler;
      window.addEventListener("message", handler);

      await new Promise<void>((resolve, reject) => {
        fb.login(
          (response: any) => {
            const code = String(response?.authResponse?.code || "").trim();
            const hasCode = !!code;
            debug("fb login callback", {
              hasCode: Boolean(response?.authResponse?.code),
              grantedScopes: response?.authResponse?.grantedScopes || null,
            });
            if (!hasCode) return reject(new Error("Meta authorization code missing. Please try again."));
            authCodeRef.current = code;
            void maybeCompleteSignup().catch((err) => reject(err));
            return resolve();
          },
          {
            config_id: configId,
            response_type: "code",
            override_default_response_type: true,
            return_scopes: true,
            auth_type: "rerequest",
            extras: { sessionInfoVersion: "3" },
          }
        );
      });

      // If session event comes after callback, keep trying briefly.
      const startedAt = Date.now();
      while (!exchangeStartedRef.current && Date.now() - startedAt < 20000) {
        await new Promise((r) => setTimeout(r, 400));
        await maybeCompleteSignup();
      }
      if (!exchangeStartedRef.current) {
        throw new Error("Embedded signup details missing. Please complete signup popup flow.");
      }
      await exchangePromise;
    } catch (e: any) {
      const backendMessage = e?.response?.data?.message || "";
      const backendDetail = e?.response?.data?.details?.message || "";
      const message = /could not be matched to the selected waba/i.test(backendMessage)
        ? "Meta returned a phone number that does not match the selected WABA. Please reconnect WhatsApp. If this repeats, contact support."
        : backendMessage || e?.message || "Could not exchange Meta code";
      setEmbeddedError(message);
      setEmbeddedDebugError(String(backendDetail || ""));
      toast(message, "error");
      signupActiveRef.current = false;
      clearMessageListener();
      await loadStatus();
    } finally {
      setEmbeddedBusy(false);
    }
  }, [clearMessageListener, loadStatus, toast]);

  const disconnectWhatsApp = useCallback(async () => {
    setEmbeddedBusy(true);
    setEmbeddedError("");
    try {
      await API.meta.disconnect();
      toast("WhatsApp disconnected", "success");
      await loadStatus();
    } catch (e: any) {
      const message = e?.response?.data?.message || "Failed to disconnect WhatsApp";
      setEmbeddedError(message);
      toast(message, "error");
    } finally {
      setEmbeddedBusy(false);
    }
  }, [loadStatus, toast]);

  const refreshConnectionMetadata = useCallback(async () => {
    setSyncing(true);
    setEmbeddedError("");
    try {
      const result = await API.meta.refreshConnectionMetadata();
      clearApiGetCache();
      setEmbeddedConnection(result?.connection || null);
      toast("WhatsApp account metadata refreshed", "success");
      await loadStatus();
    } catch (e: any) {
      const message = e?.response?.data?.message || "Failed to refresh WhatsApp account metadata";
      setEmbeddedError(message);
      toast(message, "error");
    } finally {
      setSyncing(false);
    }
  }, [loadStatus, toast]);

  const connectionStatusMessage =
    embeddedConnection?.connectionStatus === "pending_verification"
      ? "Phone connected, verification pending"
      : embeddedConnection?.connectionStatus === "pending_display_name_review"
        ? "Display name review pending"
        : embeddedConnection?.connectionStatus === "metadata_partial"
          ? "Metadata partially available from Meta"
          : null;
  const registrationWarning =
    embeddedConnection?.connected &&
    (["pending_verification", "metadata_partial"].includes(String(embeddedConnection?.connectionStatus || "")) ||
      (embeddedConnection?.codeVerificationStatus &&
        String(embeddedConnection.codeVerificationStatus).toUpperCase() !== "VERIFIED"))
      ? "Cloud API registration may still be required before sending messages"
      : null;
  const businessProfile = embeddedConnection?.businessProfile || {};

  return (
    <div className="space-y-8 pb-12 p-4 md:p-8">
      <section>
        <div className="flex items-center justify-between p-6 min-w-full border border-gray-200 rounded-[5px] bg-white shadow-sm">
          <div className="flex flex-col justify-start gap-5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Status</div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "size-3 rounded-full animate-pulse",
                  metaStatus.status === "active" ? "bg-emerald-500" : metaStatus.status === "pending" ? "bg-amber-500" : "bg-rose-500"
                )}
              />
              <span className="text-lg font-black text-black">{statusLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={embeddedConnection?.connected ? "outline" : "primary"}
              size="sm"
              className="rounded-[5px]"
              onClick={embeddedConnection?.connected ? disconnectWhatsApp : connectWhatsApp}
              disabled={isStatusLoading}
            >
              {isStatusLoading ? "Connecting..." : embeddedConnection?.connected ? "Disconnect WhatsApp" : "Connect WhatsApp"}
            </Button>
            {!isDisconnected ? (
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-gray-200 text-black hover:bg-gray-50 rounded-[5px]"
                onClick={() => void loadStatus()}
                disabled={isStatusLoading}
              >
                <RefreshCw size={14} className={cn("mr-2", isStatusLoading && "animate-spin")} />
                {syncing ? "Refreshing..." : "Refresh Status"}
              </Button>
            ) : null}
          </div>
        </div>
        {embeddedError ? <div className="text-xs font-semibold text-rose-600 mt-3">{embeddedError}</div> : null}
        {embeddedDebugError ? <div className="text-[11px] font-medium text-slate-500 mt-1">Debug: {embeddedDebugError}</div> : null}
        {embeddedPhones.length ? (
          <div className="mt-3 rounded-[5px] border border-amber-200 bg-amber-50 p-3">
            <div className="text-xs font-bold text-amber-900">Available phone numbers returned by Meta:</div>
            {embeddedPhones.map((phone) => (
              <div key={phone.id} className="mt-1 text-xs font-medium text-amber-800">
                {phone.display_phone_number || "Phone number"} ({phone.id})
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <div className="mb-4 rounded-[5px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Current WhatsApp Account</div>
          {embeddedConnection?.maskedWabaId ? (
            <Button variant="outline" size="sm" className="rounded-[5px]" onClick={() => void refreshConnectionMetadata()} disabled={syncing}>
              <RefreshCw size={14} className={cn("mr-2", syncing && "animate-spin")} />
              Refresh Metadata
            </Button>
          ) : null}
        </div>
        <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-700 md:grid-cols-4">
          <span>WABA: {embeddedConnection?.wabaName || "Not available yet"}</span>
          <span>Account status: {embeddedConnection?.connectionStatus || "Not available yet"}</span>
          <span>WABA ID: {embeddedConnection?.maskedWabaId || "Not available yet"}</span>
          <span>Phone: {embeddedConnection?.displayPhoneNumber || "Not available yet"}</span>
          <span>Phone ID: {embeddedConnection?.maskedPhoneNumberId || "Not available yet"}</span>
          <span>Verified display name: {embeddedConnection?.verifiedName || "Pending"}</span>
          <span>Display name status: {embeddedConnection?.nameStatus || "Not available yet"}</span>
          <span>Code verification: {embeddedConnection?.codeVerificationStatus || "Not available yet"}</span>
          <span>Quality rating: {embeddedConnection?.qualityRating || "Not available yet"}</span>
          <span>Platform type: {embeddedConnection?.platformType || "Not available yet"}</span>
          <span>Account mode: {embeddedConnection?.accountMode || "Not available yet"}</span>
          <span>Throughput: {embeddedConnection?.throughput ? JSON.stringify(embeddedConnection.throughput) : "Not available yet"}</span>
          <span>Messaging limit tier: {embeddedConnection?.messagingLimitTier || "Not available yet"}</span>
          <span>Last synced: {embeddedConnection?.lastMetadataSyncAt ? new Date(embeddedConnection.lastMetadataSyncAt).toLocaleString() : "Not available yet"}</span>
        </div>
        {connectionStatusMessage ? <div className="mt-3 text-xs font-bold text-amber-700">{connectionStatusMessage}</div> : null}
        {registrationWarning ? <div className="mt-1 text-xs font-semibold text-amber-700">{registrationWarning}</div> : null}
        {businessProfile.about || businessProfile.description || businessProfile.address || businessProfile.email || businessProfile.vertical || businessProfile.profilePictureUrl || businessProfile.websites?.length ? (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">Business Profile</div>
            <div className="mt-2 grid gap-2 text-xs font-semibold text-slate-700 md:grid-cols-3">
              {businessProfile.about ? <span>About: {businessProfile.about}</span> : null}
              {businessProfile.description ? <span>Description: {businessProfile.description}</span> : null}
              {businessProfile.address ? <span>Address: {businessProfile.address}</span> : null}
              {businessProfile.email ? <span>Email: {businessProfile.email}</span> : null}
              {businessProfile.vertical ? <span>Vertical: {businessProfile.vertical}</span> : null}
              {businessProfile.profilePictureUrl ? <span>Profile picture: Available</span> : null}
              {businessProfile.websites?.length ? <span>Websites: {businessProfile.websites.join(", ")}</span> : null}
            </div>
          </div>
        ) : null}
        {Array.isArray(embeddedConnection?.metadataWarnings) && embeddedConnection.metadataWarnings.length ? (
          <div className="mt-3 text-[11px] font-medium text-slate-500">
            Meta metadata warnings: {embeddedConnection.metadataWarnings.join(" | ")}
          </div>
        ) : null}
      </div>

      <div className="">
        <div className="space-y-6">
          <Card className="p-8 bg-slate-50 border-slate-100 h-full rounded-[5px]">
            {metaStatus.status === "loading" ? (
              <MetaConnectionSkeleton />
            ) : (
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <HelpCircle size={16} className="text-brand-600" />
                    Embedded Signup
                  </h4>
                  <ul className="space-y-4">
                    {[
                      "Click Connect WhatsApp",
                      "Complete Meta popup onboarding",
                      "Workspace WABA + phone are auto-linked",
                      "Webhook subscription is validated automatically",
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="size-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <span className="text-xs font-medium text-slate-600">{step}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="https://wasp-docs.vercel.app/connect-meta" target="_blank" className="mt-6 inline-flex items-center text-xs font-bold text-brand-600 hover:gap-2 transition-all">
                    View Documentation <ArrowRight size={14} className="ml-1" />
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
