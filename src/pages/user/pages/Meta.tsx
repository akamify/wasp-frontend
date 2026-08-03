import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { API, clearApiGetCache } from "@api/api";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { MetaConnectionSkeleton } from "@components/ui/Skeletons";
import { useToast } from "@shared/providers/ToastContext";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Building2,
  CheckCircle2,
  Globe,
  HelpCircle,
  Phone,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Store,
  Settings2,
  MessageSquareText,
  Workflow,
  Unplug,
} from "lucide-react";
import { cn } from "@shared/utils/cn";
import { Link } from "react-router-dom";
import { loadMetaSdk } from "@shared/utils/metaSdk";

type MetaStatus =
  | { status: "loading"; credentials: null }
  | { status: "disconnected"; credentials: null }
  | { status: "pending"; credentials: any }
  | { status: "active"; credentials: any };

export default function MetaConnectPage() {
  const [metaStatus, setMetaStatus] = useState<MetaStatus>({
    status: "loading",
    credentials: null,
  });
  const [syncing, setSyncing] = useState(false);
  const [embeddedBusy, setEmbeddedBusy] = useState(false);
  const [embeddedError, setEmbeddedError] = useState("");
  const [embeddedDebugError, setEmbeddedDebugError] = useState("");
  const [embeddedPhones, setEmbeddedPhones] = useState<
    Array<{ id: string; display_phone_number: string | null }>
  >([]);
  const [embeddedConnection, setEmbeddedConnection] = useState<any>(null);
  const [profileImageBroken, setProfileImageBroken] = useState(false);
  const authCodeRef = useRef<string | null>(null);

  const signupDetailsRef = useRef<{
    waba_id: string | null;
    phone_number_id: string | null;
  }>({
    waba_id: null,
    phone_number_id: null,
  });
  const exchangeStartedRef = useRef(false);
  const signupActiveRef = useRef(false);
  const flowIdRef = useRef<string | null>(null);
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(
    null,
  );
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
  const isConnected =
    embeddedConnection?.connected === true ||
    metaStatus.status === "active" ||
    metaStatus.status === "pending";
  const isStatusLoading = syncing || embeddedBusy;

  const loadStatus = useCallback(async () => {
    if (!isInitialLoad.current) setSyncing(true);
    try {
      const [statusResult, connectionResult] = await Promise.allSettled([
        API.meta.status(),
        API.meta.connection(),
      ]);
      const statusRes =
        statusResult.status === "fulfilled" ? statusResult.value : null;
      const connectionRes =
        connectionResult.status === "fulfilled" ? connectionResult.value : null;

      if (!statusRes && !connectionRes) {
        const error =
          statusResult.status === "rejected"
            ? statusResult.reason
            : connectionResult.status === "rejected"
              ? connectionResult.reason
              : null;
        throw error || new Error("Failed to fetch WhatsApp connection status");
      }

      if (connectionRes) {
        setEmbeddedConnection(connectionRes);
      }

      const statusFromApi = String(statusRes?.status || "").toLowerCase();
      const statusFromConnection = String(
        connectionRes?.status || "",
      ).toLowerCase();
      const connectionConfirmed = connectionRes?.connected === true;
      const disconnectConfirmed =
        connectionResult.status === "fulfilled" &&
        connectionRes?.connected === false;

      if (connectionResult.status === "fulfilled") {
        if (connectionConfirmed || statusFromConnection === "active") {
          setMetaStatus({
            status: "active",
            credentials: statusRes?.credentials || null,
          });
        } else if (statusFromConnection === "pending") {
          setMetaStatus({
            status: "pending",
            credentials: statusRes?.credentials || null,
          });
        } else if (disconnectConfirmed) {
          setMetaStatus({ status: "disconnected", credentials: null });
        }
      } else if (statusFromApi === "active") {
        setMetaStatus({
          status: "active",
          credentials: statusRes?.credentials || null,
        });
      } else if (statusFromApi === "pending") {
        setMetaStatus({
          status: "pending",
          credentials: statusRes?.credentials || null,
        });
      } else if (statusFromApi === "disconnected") {
        setMetaStatus({ status: "disconnected", credentials: null });
      }

      if (!isInitialLoad.current) toast("Connection status updated", "success");
    } catch (e: any) {
      toast(
        e?.response?.data?.message ||
          "Failed to fetch WhatsApp connection status",
        "error",
      );
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

  useEffect(() => {
    setProfileImageBroken(false);
  }, [embeddedConnection?.businessProfile?.profilePictureUrl]);

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
        env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID ||
          env.VITE_META_EMBEDDED_SIGNUP_CONFIG_ID ||
          "",
      ).trim();
      if (!configId)
        throw new Error("Missing META Embedded Signup Config ID env");

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
            setEmbeddedError(
              result?.message ||
                "Meta did not return a phone number. Please select a phone number and reconnect WhatsApp.",
            );
            signupActiveRef.current = false;
            clearMessageListener();
            return;
          }
          await API.templates.refreshWhatsApp().catch((error: any) => {
            debug("template sync after connect failed", {
              message:
                error?.response?.data?.message ||
                error?.message ||
                "Unknown error",
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
        const allowed = [
          "https://www.facebook.com",
          "https://web.facebook.com",
        ];
        if (!allowed.includes(String(event.origin || ""))) return;
        if (!signupActiveRef.current || exchangeStartedRef.current) return;
        if (!currentFlowId || flowIdRef.current !== currentFlowId) return;
        try {
          const payload =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;
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
          const data =
            payload?.data && typeof payload.data === "object"
              ? payload.data
              : {};
          const wabaId = String(data?.waba_id || "").trim() || null;
          const phoneNumberId =
            String(data?.phone_number_id || "").trim() || null;
          debug("WA Embedded Signup FINISH received", {
            type: payload?.type || null,
            event: payload?.event || null,
            dataKeys: Object.keys(data || {}),
            hasWabaId: !!wabaId,
            hasPhoneNumberId: !!phoneNumberId,
          });
          if (!wabaId) {
            setEmbeddedError(
              "Meta did not return a WABA ID. Please try again.",
            );
            signupActiveRef.current = false;
            clearMessageListener();
            return;
          }
          const session = { waba_id: wabaId, phone_number_id: phoneNumberId };
          signupDetailsRef.current = session;
          void maybeCompleteSignup().catch(() => {});
        } catch {
          // ignore malformed payloads
        }
      };
      messageHandlerRef.current = handler;
      window.addEventListener("message", handler);

      await new Promise<void>((resolve, reject) => {
        fb.login(
          (response: any) => {
            const code = String(
              response?.authResponse?.code || response?.code || "",
            ).trim();
            const hasCode = !!code;
            debug("fb login callback", {
              hasCode,
              status: response?.status || null,
              hasAuthResponse: Boolean(response?.authResponse),
              grantedScopes: response?.authResponse?.grantedScopes || null,
            });
            if (!hasCode) {
              const reason =
                response?.error?.message ||
                response?.error_message ||
                (response?.status === "not_authorized"
                  ? "Meta authorization was not completed. Please allow the requested WhatsApp permissions."
                  : !response?.authResponse
                    ? "Meta did not authorize this app. The Meta app may be inactive, disabled, or unavailable to this Facebook account. Reactivate the app in Meta App Dashboard before connecting WhatsApp."
                    : "Meta authorization code missing. Please close the popup and try again.");
              return reject(new Error(reason));
            }
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
          },
        );
      });

      // If session event comes after callback, keep trying briefly.
      const startedAt = Date.now();
      while (!exchangeStartedRef.current && Date.now() - startedAt < 20000) {
        await new Promise((r) => setTimeout(r, 400));
        await maybeCompleteSignup();
      }
      if (!exchangeStartedRef.current) {
        throw new Error(
          "Embedded signup details missing. Please complete signup popup flow.",
        );
      }
      await exchangePromise;
    } catch (e: any) {
      const backendMessage = e?.response?.data?.message || "";
      const backendDetail = e?.response?.data?.details?.message || "";
      const message = /could not be matched to the selected waba/i.test(
        backendMessage,
      )
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
      clearApiGetCache();
      toast("WhatsApp disconnected", "success");
      await loadStatus();
    } catch (e: any) {
      const message =
        e?.response?.data?.message || "Failed to disconnect WhatsApp";
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
      if (result?.connection?.authorizationRequired) {
        toast(
          "Meta authorization is no longer valid. Reconnect WhatsApp to refresh live metadata.",
          "warning",
        );
      } else {
        toast("WhatsApp account metadata refreshed", "success");
      }
      await loadStatus();
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        "Failed to refresh WhatsApp account metadata";
      setEmbeddedError(message);
      toast(message, "error");
    } finally {
      setSyncing(false);
    }
  }, [loadStatus, toast]);

  const connectionStatusMessage =
    embeddedConnection?.connectionStatus === "reauthorization_required"
      ? "Meta authorization expired or was revoked. Reconnect WhatsApp to restore live phone and profile metadata."
      : embeddedConnection?.connectionStatus === "pending_verification"
        ? "Phone connected, verification pending"
        : embeddedConnection?.connectionStatus === "pending_display_name_review"
          ? "Display name review pending"
          : embeddedConnection?.connectionStatus === "metadata_partial"
            ? "Metadata partially available from Meta"
            : null;
  const registrationWarning =
    embeddedConnection?.connected &&
    (["pending_verification", "metadata_partial"].includes(
      String(embeddedConnection?.connectionStatus || ""),
    ) ||
      (embeddedConnection?.codeVerificationStatus &&
        String(embeddedConnection.codeVerificationStatus).toUpperCase() !==
          "VERIFIED"))
      ? "Cloud API registration may still be required before sending messages"
      : null;
  const businessProfile = embeddedConnection?.businessProfile || {};
  const authorizationRequired =
    embeddedConnection?.authorizationRequired === true ||
    embeddedConnection?.connectionStatus === "reauthorization_required";
  const throughputLabel =
    embeddedConnection?.throughput?.level ||
    (embeddedConnection?.throughput
      ? JSON.stringify(embeddedConnection.throughput)
      : "Not available yet");
  const warningCount =
    Number(Boolean(connectionStatusMessage)) +
    Number(Boolean(registrationWarning)) +
    Number(
      Array.isArray(embeddedConnection?.metadataWarnings)
        ? embeddedConnection.metadataWarnings.length
        : 0,
    );
  const setupSteps = [
    {
      title: "Connect Meta",
      description: "Link your WhatsApp Business Account",
      icon: <PlugZap size={17} />,
      state: isConnected ? "complete" : "current",
    },
    {
      title: "Business profile",
      description: "Review customer-facing information",
      icon: <Building2 size={17} />,
      state:
        businessProfile?.about || businessProfile?.profilePictureUrl
          ? "complete"
          : isConnected
            ? "current"
            : "locked",
    },
    {
      title: "Phone readiness",
      description: "Confirm number and verification status",
      icon: <Phone size={17} />,
      state:
        String(
          embeddedConnection?.codeVerificationStatus || "",
        ).toUpperCase() === "VERIFIED"
          ? "complete"
          : isConnected
            ? "current"
            : "locked",
    },
    {
      title: "Messaging tools",
      description: "Templates, automation and campaigns",
      icon: <Workflow size={17} />,
      state:
        isConnected && warningCount === 0
          ? "complete"
          : isConnected
            ? "current"
            : "locked",
    },
  ] as const;

  const completedSteps = setupSteps.filter(
    (step) => step.state === "complete",
  ).length;
  const setupProgress = Math.round((completedSteps / setupSteps.length) * 100);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#f3f6fb_42%,#eef2f7_100%)] px-2 py-2 text-slate-900 sm:px-2 lg:px-2 lg:py-2">
      <div className="mx-auto w-full max-w-[1480px]">
        <header className="mb-2 flex flex-col gap-4 rounded-[2px] border border-slate-200/80 bg-white/95 px-4 py-4 shadow-[0_18px_55px_-40px_rgba(15,23,42,0.5)] backdrop-blur sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-slate-950 text-white shadow-lg shadow-slate-950/15">
              <Store size={21} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Marketplace dashboard
                <ChevronRight size={13} />
                Integrations
              </div>
              <h1 className="mt-1 truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                WhatsApp Business setup
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={metaStatus.status} label={statusLabel} />
            <Button
              variant="outline"
              className="h-10 rounded-xl border-slate-200 bg-white px-3.5 font-bold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
              onClick={() => void loadStatus()}
              disabled={isStatusLoading}
            >
              <RefreshCw size={15} className={cn(syncing && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Link
              to="/academy/getting-started/connect-meta-whatsapp-business"
              target="_blank"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Help
              <ExternalLink size={14} />
            </Link>
          </div>
        </header>

        {embeddedError ? (
          <AlertBox
            tone="error"
            title="Connection issue"
            body={embeddedError}
          />
        ) : null}
        {embeddedDebugError ? (
          <AlertBox
            tone="neutral"
            title="Technical detail"
            body={embeddedDebugError}
          />
        ) : null}

        <div className="grid min-w-0 items-start gap-2 min-[1180px]:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="min-w-0 space-y-4 min-[1180px]:sticky min-[1180px]:top-5 min-[1180px]:self-start">
            <Card className="overflow-hidden rounded-[2px] border border-slate-200/90 bg-white p-0 shadow-[0_20px_60px_-44px_rgba(15,23,42,0.5)]">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Setup progress
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-950">
                      Workspace readiness
                    </p>
                  </div>
                  <div className="flex size-12 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                    {setupProgress}%
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${setupProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-3">
                {setupSteps.map((step, index) => (
                  <SetupStep
                    key={step.title}
                    index={index + 1}
                    title={step.title}
                    description={step.description}
                    icon={step.icon}
                    state={step.state}
                  />
                ))}
              </div>
            </Card>

            <Card className="relative overflow-hidden rounded-[2px] border border-white/10 bg-[linear-gradient(145deg,#0f172a,#17233b)] p-5 text-white shadow-[0_28px_70px_-42px_rgba(15,23,42,0.9)]">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/10">
                <MessageSquareText size={19} />
              </div>
              <h3 className="mt-4 text-lg font-black">
                Need setup assistance?
              </h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-300">
                Follow the guided Meta signup once. WABA, phone and account
                metadata are linked automatically.
              </p>
              <Link
                to="/academy/getting-started/connect-meta-whatsapp-business"
                target="_blank"
                className="mt-4 inline-flex items-center gap-2 text-sm font-black text-white"
              >
                Open setup guide <ArrowRight size={15} />
              </Link>
            </Card>
          </aside>

          <main className="min-w-0 space-y-5">
            <Card className="relative overflow-hidden rounded-[2px] border border-emerald-300/10 bg-[linear-gradient(135deg,#071913_0%,#0b3b2d_52%,#08704f_100%)] p-5 text-white shadow-[0_30px_80px_-42px_rgba(5,90,63,0.82)] sm:p-7">
              <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-emerald-300/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-teal-300/10 blur-3xl" />
              <div className="relative grid min-w-0 gap-7 min-[1380px]:grid-cols-[minmax(0,1fr)_280px] min-[1380px]:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">
                    <Sparkles size={13} />
                    Official Meta embedded signup
                  </div>
                  <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-[-0.03em] sm:text-4xl">
                    Connect WhatsApp to your marketplace workspace
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-200 sm:text-[15px]">
                    Manage customer conversations, automated follow-ups,
                    approved templates and campaign delivery from one connected
                    business account.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-12 min-w-[190px] justify-center gap-2 rounded-xl px-5 font-black",
                        "transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0",
                        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
                        isConnected
                          ? "!border-white/80 !bg-white !text-slate-950 shadow-lg shadow-black/10 hover:!border-white hover:!bg-slate-100 [&_svg]:!text-slate-950"
                          : "!border-emerald-300 !bg-emerald-400 !text-emerald-950 shadow-lg shadow-emerald-950/20 hover:!border-emerald-200 hover:!bg-emerald-300 [&_svg]:!text-emerald-950",
                      )}
                      onClick={
                        isConnected ? disconnectWhatsApp : connectWhatsApp
                      }
                      disabled={isStatusLoading}
                      aria-busy={isStatusLoading}
                    >
                      {isStatusLoading ? (
                        <>
                          <RefreshCw size={17} className="animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : isConnected ? (
                        <>
                          <Unplug size={17} />
                          <span>Disconnect account</span>
                        </>
                      ) : (
                        <>
                          <PlugZap size={17} />
                          <span>Connect WhatsApp</span>
                        </>
                      )}
                    </Button>

                    {authorizationRequired ? (
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-12 min-w-[150px] justify-center gap-2 rounded-xl px-5 font-black",
                          "!border-amber-300 !bg-amber-300 !text-amber-950",
                          "transition-all duration-200 hover:-translate-y-0.5",
                          "hover:!border-amber-200 hover:!bg-amber-200 active:translate-y-0",
                          "disabled:pointer-events-none disabled:opacity-60",
                          "[&_svg]:!text-amber-950",
                        )}
                        onClick={() => void connectWhatsApp()}
                        disabled={isStatusLoading}
                      >
                        <ShieldCheck size={16} />
                        <span>Reauthorize</span>
                      </Button>
                    ) : (
                      <div className="inline-flex min-w-0 items-center gap-2 text-xs font-bold leading-5 text-emerald-100">
                        <ShieldCheck size={15} className="shrink-0" />
                        <span>
                          Secure OAuth connection. No password stored.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid min-w-0 grid-cols-2 gap-2 min-[1380px]:w-[280px]">
                  <HeroMetric label="Status" value={statusLabel} />
                  <HeroMetric label="Warnings" value={String(warningCount)} />
                  <HeroMetric
                    label="Business"
                    value={
                      embeddedConnection?.verifiedName ||
                      embeddedConnection?.wabaName ||
                      "Pending"
                    }
                    wide
                  />
                </div>
              </div>
            </Card>

               <section className="grid min-w-0 items-start gap-5 min-[1380px]:grid-cols-[minmax(0,1fr)_320px]">
              <Card className="overflow-hidden rounded-[2px] border border-slate-200/90 bg-white p-0 shadow-[0_20px_60px_-44px_rgba(15,23,42,0.52)]">
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Business profile
                      </p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">
                        Customer preview
                      </h3>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
                        businessProfile.profilePictureUrl
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700",
                      )}
                    >
                      {businessProfile.profilePictureUrl ? "Ready" : "Partial"}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-[#efeae2] shadow-sm">
                    <div className="bg-[#0b141a] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 font-black text-emerald-800">
                          {businessProfile.profilePictureUrl &&
                          !profileImageBroken ? (
                            <img
                              src={businessProfile.profilePictureUrl}
                              alt="WhatsApp business profile"
                              className="h-full w-full object-cover"
                              onError={() => setProfileImageBroken(true)}
                            />
                          ) : (
                            String(
                              embeddedConnection?.verifiedName ||
                                embeddedConnection?.wabaName ||
                                "WA",
                            )
                              .trim()
                              .slice(0, 2)
                              .toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-white">
                            {embeddedConnection?.verifiedName ||
                              embeddedConnection?.wabaName ||
                              "Business profile"}
                          </p>
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                            Business account
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3 p-3">
                      <div className="ml-auto max-w-[88%] rounded-[8px_8px_2px_8px] bg-[#d9fdd3] px-3 py-2.5 shadow-sm">
                        <p className="text-xs font-semibold leading-5 text-slate-800">
                          {businessProfile.about ||
                            "Your business description will appear here after Meta profile sync."}
                        </p>
                        <p className="mt-1 text-right text-[9px] font-medium text-slate-500">
                          Business info
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/90 p-3 shadow-sm">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                          <Globe size={12} /> Category
                        </div>
                        <p className="mt-1.5 text-xs font-bold text-slate-700">
                          {businessProfile.vertical ||
                            "Business category pending"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    <ProfileRow
                      label="Email"
                      value={businessProfile.email || "Not available"}
                    />
                    <ProfileRow
                      label="Website"
                      value={
                        businessProfile.websites?.length
                          ? businessProfile.websites.join(", ")
                          : "Not available"
                      }
                    />
                    <ProfileRow
                      label="Address"
                      value={businessProfile.address || "Not available"}
                    />
                  </div>
                </div>
              </Card>

              <Card className="rounded-[2px] border border-slate-200/90 bg-white p-5 shadow-[0_20px_60px_-44px_rgba(15,23,42,0.52)] min-[1380px]:sticky min-[1380px]:top-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Settings2 size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.17em] text-slate-400">
                      Connection health
                    </p>
                    <p className="mt-0.5 text-base font-black text-slate-950">
                      Readiness checklist
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5">
                  <HealthItem
                    label="Meta authorization"
                    healthy={!authorizationRequired && isConnected}
                    pending={!isConnected}
                  />
                  <HealthItem
                    label="Business account linked"
                    healthy={Boolean(embeddedConnection?.maskedWabaId)}
                    pending={!isConnected}
                  />
                  <HealthItem
                    label="Phone number linked"
                    healthy={Boolean(embeddedConnection?.maskedPhoneNumberId)}
                    pending={!isConnected}
                  />
                  <HealthItem
                    label="Phone verified"
                    healthy={
                      String(
                        embeddedConnection?.codeVerificationStatus || "",
                      ).toUpperCase() === "VERIFIED"
                    }
                    pending={!isConnected}
                  />
                </div>
              </Card>
            </section>

            {embeddedPhones.length ? (
              <Card className="rounded-[20px] border border-amber-200 bg-amber-50 p-4 shadow-none">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">
                  Phone selection required
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {embeddedPhones.map((phone) => (
                    <div
                      key={phone.id}
                      className="rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm font-semibold text-amber-950"
                    >
                      {phone.display_phone_number || "Phone number"}
                      <span className="mt-0.5 block text-xs font-medium text-amber-700">
                        ID: {phone.id}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            <section className="grid gap-4 sm:grid-cols-2 min-[1380px]:grid-cols-4">
              <OverviewCard
                icon={<Building2 size={18} />}
                label="Business"
                value={
                  embeddedConnection?.verifiedName ||
                  embeddedConnection?.wabaName ||
                  "Not linked"
                }
                helper={embeddedConnection?.nameStatus || "Awaiting connection"}
              />
              <OverviewCard
                icon={<Phone size={18} />}
                label="Phone"
                value={embeddedConnection?.displayPhoneNumber || "Not linked"}
                helper={
                  embeddedConnection?.codeVerificationStatus ||
                  "Awaiting verification"
                }
              />
              <OverviewCard
                icon={<Activity size={18} />}
                label="Quality"
                value={embeddedConnection?.qualityRating || "Not available"}
                helper={
                  embeddedConnection?.messagingLimitTier ||
                  "Messaging tier pending"
                }
              />
              <OverviewCard
                icon={<AlertTriangle size={18} />}
                label="Warnings"
                value={String(warningCount)}
                helper={
                  warningCount
                    ? "Action may be required"
                    : "Everything looks healthy"
                }
                warning={warningCount > 0}
              />
            </section>

            <Card className="rounded-[2px] border border-slate-200/90 bg-white p-5 shadow-[0_20px_60px_-44px_rgba(15,23,42,0.52)] transition-shadow duration-300 hover:shadow-[0_26px_70px_-48px_rgba(15,23,42,0.58)] sm:p-6">
              <SectionHeading
                eyebrow="Connected account"
                title="WhatsApp account details"
                description="Live business identity, phone readiness and messaging capacity synced from Meta."
                action={
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl border-slate-200 bg-white px-3.5 font-bold transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                    onClick={() => void refreshConnectionMetadata()}
                    disabled={syncing || !embeddedConnection?.maskedWabaId}
                  >
                    <Activity size={15} />
                    Sync metadata
                  </Button>
                }
              />

              {metaStatus.status === "loading" ? (
                <div className="mt-5">
                  <MetaConnectionSkeleton />
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 min-[1380px]:grid-cols-3">
                  <DataField
                    label="WABA name"
                    value={embeddedConnection?.wabaName || "Not available"}
                  />
                  <DataField
                    label="WABA ID"
                    value={embeddedConnection?.maskedWabaId || "Not available"}
                  />
                  <DataField
                    label="Phone number"
                    value={
                      embeddedConnection?.displayPhoneNumber || "Not available"
                    }
                  />
                  <DataField
                    label="Phone number ID"
                    value={
                      embeddedConnection?.maskedPhoneNumberId || "Not available"
                    }
                  />
                  <DataField
                    label="Display name"
                    value={embeddedConnection?.verifiedName || "Pending review"}
                  />
                  <DataField
                    label="Name status"
                    value={embeddedConnection?.nameStatus || "Not available"}
                  />
                  <DataField
                    label="Code verification"
                    value={
                      embeddedConnection?.codeVerificationStatus ||
                      "Not available"
                    }
                  />
                  <DataField
                    label="Platform"
                    value={embeddedConnection?.platformType || "Not available"}
                  />
                  <DataField
                    label="Account mode"
                    value={embeddedConnection?.accountMode || "Not available"}
                  />
                  <DataField
                    label="Messaging limit"
                    value={
                      embeddedConnection?.messagingLimitTier || "Not available"
                    }
                  />
                  <DataField label="Throughput" value={throughputLabel} />
                  <DataField
                    label="Last synced"
                    value={
                      embeddedConnection?.lastMetadataSyncAt
                        ? formatMetaDateTime(
                            embeddedConnection.lastMetadataSyncAt,
                          )
                        : "Not available"
                    }
                  />
                </div>
              )}

              {connectionStatusMessage ||
              registrationWarning ||
              (Array.isArray(embeddedConnection?.metadataWarnings) &&
                embeddedConnection.metadataWarnings.length) ? (
                <div className="mt-5 space-y-3">
                  {connectionStatusMessage ? (
                    <StatusNotice
                      tone="amber"
                      title="Connection health"
                      body={connectionStatusMessage}
                    />
                  ) : null}
                  {registrationWarning ? (
                    <StatusNotice
                      tone="amber"
                      title="Registration warning"
                      body={registrationWarning}
                    />
                  ) : null}
                  {Array.isArray(embeddedConnection?.metadataWarnings) &&
                  embeddedConnection.metadataWarnings.length ? (
                    <StatusNotice
                      tone="slate"
                      title="Metadata warnings"
                      body={embeddedConnection.metadataWarnings.join(" | ")}
                    />
                  ) : null}
                </div>
              ) : null}
            </Card>

            <Card className="rounded-[2px] border border-slate-200/90 bg-white p-5 shadow-[0_20px_60px_-44px_rgba(15,23,42,0.52)] transition-shadow duration-300 hover:shadow-[0_26px_70px_-48px_rgba(15,23,42,0.58)] sm:p-6">
              <SectionHeading
                eyebrow="How setup works"
                title="Complete onboarding in four steps"
                description="The embedded flow handles authorization and links the selected WhatsApp assets to this workspace."
              />
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {[
                  [
                    "01",
                    "Start embedded signup",
                    "Open Meta's secure signup window from the Connect WhatsApp button.",
                  ],
                  [
                    "02",
                    "Choose your business",
                    "Select or create the Meta business and WhatsApp Business Account.",
                  ],
                  [
                    "03",
                    "Attach a phone number",
                    "Select the number that will send templates, campaigns and replies.",
                  ],
                  [
                    "04",
                    "Sync the workspace",
                    "The account, phone metadata and templates are refreshed automatically.",
                  ],
                ].map(([number, title, description]) => (
                  <div
                    key={number}
                    className="group rounded-[18px] border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white">
                        {number}
                      </span>
                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {title}
                        </p>
                        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                          {description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

         
          </main>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  label,
}: {
  status: MetaStatus["status"];
  label: string;
}) {
  const styles =
    status === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "pending"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : status === "loading"
          ? "border-slate-200 bg-slate-50 text-slate-600"
          : "border-rose-200 bg-rose-50 text-rose-700";
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black",
        styles,
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          status === "active"
            ? "bg-emerald-500"
            : status === "pending"
              ? "bg-amber-500"
              : status === "loading"
                ? "animate-pulse bg-slate-400"
                : "bg-rose-500",
        )}
      />
      {label}
    </div>
  );
}

function SetupStep({
  index,
  title,
  description,
  icon,
  state,
}: {
  index: number;
  title: string;
  description: string;
  icon: ReactNode;
  state: "complete" | "current" | "locked";
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[15px] border px-3 py-3 transition-all duration-200",
        state === "current"
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-transparent hover:bg-slate-50",
        state === "locked" && "opacity-55",
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          state === "complete"
            ? "bg-emerald-500 text-white"
            : state === "current"
              ? "bg-white text-emerald-700 shadow-sm"
              : "bg-slate-100 text-slate-400",
        )}
      >
        {state === "complete" ? <CheckCircle2 size={17} /> : icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-black text-slate-900">{title}</p>
          <span className="text-[10px] font-black text-slate-300">
            0{index}
          </span>
        </div>
        <p className="mt-0.5 text-xs font-medium leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[16px] border border-white/10 bg-white/10 p-3.5 backdrop-blur",
        wide && "col-span-2",
      )}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
        {label}
      </p>
      <p className="mt-2 truncate text-base font-black text-white">{value}</p>
    </div>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  helper,
  warning = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
  warning?: boolean;
}) {
  return (
    <Card className="rounded-[18px] border border-slate-200/90 bg-white p-4 shadow-[0_16px_44px_-36px_rgba(15,23,42,0.46)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_22px_54px_-38px_rgba(15,23,42,0.55)]">
      <div className="flex items-center justify-between gap-3">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-xl",
            warning
              ? "bg-amber-50 text-amber-700"
              : "bg-slate-100 text-slate-700",
          )}
        >
          {icon}
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.17em] text-slate-400">
          {label}
        </p>
      </div>
      <p className="mt-3 truncate text-base font-black text-slate-950">
        {value}
      </p>
      <p className="mt-1 truncate text-xs font-medium text-slate-500">
        {helper}
      </p>
    </Card>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          {eyebrow}
        </p>
        <h3 className="mt-1.5 text-xl font-black tracking-tight text-slate-950">
          {title}
        </h3>
        <p className="mt-1.5 max-w-2xl text-sm font-medium leading-6 text-slate-500">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[15px] border border-slate-200 bg-slate-50/70 px-4 py-3.5 transition-colors duration-200 hover:border-slate-300 hover:bg-white">
      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm font-bold leading-5 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 transition-colors duration-200 hover:border-slate-300 hover:bg-white">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-bold leading-5 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function HealthItem({
  label,
  healthy,
  pending,
}: {
  label: string;
  healthy: boolean;
  pending?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em]",
          healthy
            ? "text-emerald-700"
            : pending
              ? "text-slate-400"
              : "text-amber-700",
        )}
      >
        {healthy ? (
          <CheckCircle2 size={14} />
        ) : pending ? (
          <HelpCircle size={14} />
        ) : (
          <AlertTriangle size={14} />
        )}
        {healthy ? "Ready" : pending ? "Pending" : "Review"}
      </span>
    </div>
  );
}

function AlertBox({
  tone,
  title,
  body,
}: {
  tone: "error" | "neutral";
  title: string;
  body: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 rounded-[16px] border px-4 py-3",
        tone === "error"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-slate-200 bg-white text-slate-600",
      )}
    >
      <p className="text-xs font-black uppercase tracking-[0.15em]">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6">{body}</p>
    </div>
  );
}

function StatusNotice({
  tone,
  title,
  body,
}: {
  tone: "amber" | "slate";
  title: string;
  body: string;
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <div className={cn("rounded-[14px] border px-4 py-3", toneClass)}>
      <div className="text-[11px] font-black uppercase tracking-[0.18em]">
        {title}
      </div>
      <div className="mt-1 text-sm font-semibold leading-6">{body}</div>
    </div>
  );
}

function formatMetaDateTime(value?: string | null) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}
