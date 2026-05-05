import React, { useEffect, useMemo, useState } from "react";
import { API } from "../api/api";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { CheckCircle2, Upload } from "lucide-react";
import {
  inspectTemplate,
  parseCommaList,
  type TemplateRecord,
} from "../utils/templateRuntime";

type Contact = {
  _id: string;
  name?: string;
  phone: string;
  company?: string;
};

type BulkRecipient = {
  to: string;
  variables?: string[];
  headerVariables?: string[];
  otpCode?: string;
  buttonValues?: string[];
  buttonTtlMinutes?: number[];
  flowTokens?: string[];
  flowActionData?: any[];
};

type BulkPayload = {
  templateId: string;
  concurrency?: number;
  recipients: BulkRecipient[];
};

type LifecycleStatus = "accepted" | "sent" | "delivered" | "read" | "failed" | "";

function optionalTrimmed(value: string) {
  const trimmed = String(value || "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export default function SendPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState("");
  const [selectedContactPhone, setSelectedContactPhone] = useState("");
  const [to, setTo] = useState("");
  const [headerVariables, setHeaderVariables] = useState("");
  const [variables, setVariables] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [buttonValues, setButtonValues] = useState("");
  const [buttonTtlMinutes, setButtonTtlMinutes] = useState("");
  const [flowTokens, setFlowTokens] = useState("");
  const [flowActionDataJson, setFlowActionDataJson] = useState("{}");
  const [busy, setBusy] = useState(false);
  const [headerUploadBusy, setHeaderUploadBusy] = useState(false);
  const [headerUploadPct, setHeaderUploadPct] = useState(0);
  const [headerUploadError, setHeaderUploadError] = useState<string | null>(null);

  const [bulkJson, setBulkJson] = useState(
    JSON.stringify(
      {
        templateId: "",
        concurrency: 5,
        recipients: [
          {
            to: "919999999999",
            variables: ["A", "B"],
            headerVariables: [],
            buttonValues: ["order-123"],
            buttonTtlMinutes: [43200],
            flowTokens: [],
            flowActionData: [],
          },
        ],
      },
      null,
      2
    )
  );
  const [bulkBusy, setBulkBusy] = useState(false);
  const [lastWaId, setLastWaId] = useState("");
  const [lifecycleStatus, setLifecycleStatus] = useState<LifecycleStatus>("");
  const [lifecycleTimestamps, setLifecycleTimestamps] = useState<Record<string, string>>({});
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const [lifecyclePolling, setLifecyclePolling] = useState(false);

  const approvedTemplates = useMemo(
    () => templates.filter((template) => template.status === "approved"),
    [templates]
  );

  const selectedTemplate = useMemo(
    () => approvedTemplates.find((template) => template._id === templateId),
    [approvedTemplates, templateId]
  );

  const selectedTemplateSummary = useMemo(
    () => inspectTemplate(selectedTemplate),
    [selectedTemplate]
  );

  useEffect(() => {
    if (selectedTemplateSummary.voiceCallButtons.length > 0 && !buttonTtlMinutes.trim()) {
      setButtonTtlMinutes(selectedTemplateSummary.voiceCallButtons.map(() => "43200").join(", "));
    }
    if (selectedTemplateSummary.flowButtons.length > 0 && !flowActionDataJson.trim()) {
      setFlowActionDataJson("{}");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplateSummary.voiceCallButtons.length, selectedTemplateSummary.flowButtons.length]);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    Promise.all([API.templates.list(), API.contacts.list({ limit: 250 })])
      .then(([templateRes, contactRes]) => {
        if (!alive) return;
        const approved = (templateRes.templates || []).filter(
          (template: TemplateRecord) => template.status === "approved"
        );
        setTemplates(templateRes.templates || []);
        setContacts(contactRes.contacts || []);
        if (approved.length > 0) {
          const helloWorld = approved.find((template: TemplateRecord) => template.name === "hello_world");
          setTemplateId((current) => current || helloWorld?._id || approved[0]._id);
        }
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.response?.data?.message || "Failed to load send workspace");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedContactPhone) return;
    setTo(selectedContactPhone);
  }, [selectedContactPhone]);

  useEffect(() => {
    if (!lastWaId) return undefined;
    if (!lifecycleStatus || lifecycleStatus === "read" || lifecycleStatus === "failed") {
      return undefined;
    }

    let cancelled = false;
    let attempts = 0;
    setLifecyclePolling(true);
    setLifecycleError(null);

    const interval = window.setInterval(async () => {
      if (cancelled) return;
      attempts += 1;

      try {
        const res = await API.messages.status(lastWaId);
        if (cancelled || !res?.success) return;
        const nextStatus = String(res.status || "").toLowerCase() as LifecycleStatus;
        if (nextStatus) setLifecycleStatus(nextStatus);
        if (res.statusTimestamps && typeof res.statusTimestamps === "object") {
          setLifecycleTimestamps(res.statusTimestamps);
        }
        if (nextStatus === "read" || nextStatus === "failed") {
          setLifecyclePolling(false);
          window.clearInterval(interval);
        }
      } catch (pollErr: any) {
        const statusCode = Number(pollErr?.response?.status || 0);
        if (statusCode !== 404) {
          setLifecycleError("Status refresh failed. Retry will continue.");
        }
      }

      if (attempts >= 45) {
        setLifecyclePolling(false);
        window.clearInterval(interval);
      }
    }, 4000);

    return () => {
      cancelled = true;
      setLifecyclePolling(false);
      window.clearInterval(interval);
    };
  }, [lastWaId, lifecycleStatus]);

  async function sendOne(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setBusy(true);

    try {
      if (!selectedTemplate) {
        throw new Error("Select an approved template first");
      }

      const headerVars =
        selectedTemplateSummary.headerFormat === "IMAGE" ||
        selectedTemplateSummary.headerFormat === "VIDEO" ||
        selectedTemplateSummary.headerFormat === "DOCUMENT"
          ? (optionalTrimmed(headerVariables) ? [String(headerVariables || "").trim()] : [])
          : parseCommaList(headerVariables);

      const payload = {
        templateId,
        to,
        headerVariables: headerVars,
        variables: parseCommaList(variables),
        otpCode: optionalTrimmed(otpCode),
        buttonValues: parseCommaList(buttonValues),
        buttonTtlMinutes:
          selectedTemplateSummary.voiceCallButtons.length > 0
            ? (() => {
                const raw = parseCommaList(buttonTtlMinutes);
                const mapped: Array<number | null> = [];
                selectedTemplateSummary.voiceCallButtons.forEach((button, idx) => {
                  const value = Number(raw[idx] ?? "");
                  mapped[button.index] = Number.isFinite(value) ? value : null;
                });
                return mapped;
              })()
            : undefined,
        flowTokens:
          selectedTemplateSummary.flowButtons.length > 0
            ? (() => {
                const raw = parseCommaList(flowTokens);
                const mapped: Array<string | null> = [];
                selectedTemplateSummary.flowButtons.forEach((button, idx) => {
                  const token = String(raw[idx] ?? "").trim();
                  mapped[button.index] = token || null;
                });
                return mapped;
              })()
            : undefined,
        flowActionData:
          selectedTemplateSummary.flowButtons.length > 0
            ? (() => {
                let parsed: any = null;
                try {
                  parsed = flowActionDataJson.trim() ? JSON.parse(flowActionDataJson) : null;
                } catch {
                  parsed = null;
                }
                const mapped: Array<any | null> = [];
                selectedTemplateSummary.flowButtons.forEach((button) => {
                  mapped[button.index] = parsed && typeof parsed === "object" ? parsed : null;
                });
                return mapped;
              })()
            : undefined,
      };

      const res = await API.messages.send(payload);
      const waId = String(res.message?.whatsappMessageId || "");
      setOk(`Accepted by Meta. Message ID: ${waId || res.message?._id}. Waiting for delivery receipts...`);
      setLastWaId(waId);
      setLifecycleStatus("accepted");
      setLifecycleError(null);
      setLifecycleTimestamps(res.message?.statusTimestamps || {});
    } catch (e: any) {
      setError(
        e?.response?.data?.details?.providerError ||
          e?.response?.data?.details?.metaDebug?.meta?.error_user_msg ||
          e?.response?.data?.message ||
          "Send failed"
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendBulk(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setBulkBusy(true);

    try {
      const payload: BulkPayload = JSON.parse(bulkJson);

      if (!payload.templateId) {
        throw new Error("bulkJson.templateId is required");
      }

      const normalizedPayload: BulkPayload = {
        ...payload,
          recipients: (payload.recipients || []).map((recipient) => ({
            to: recipient.to,
            variables: recipient.variables,
            headerVariables: recipient.headerVariables,
            otpCode: optionalTrimmed(String(recipient.otpCode || "")),
            buttonValues: recipient.buttonValues,
            buttonTtlMinutes: recipient.buttonTtlMinutes,
            flowTokens: recipient.flowTokens,
            flowActionData: recipient.flowActionData,
          })),
      };

      const res = await API.messages.bulk(normalizedPayload);
      setOk(`Bulk done. Results: ${res.count}`);
    } catch (e: any) {
      setError(
        e?.response?.data?.details?.providerError ||
          e?.response?.data?.message ||
          e?.message ||
          "Bulk send failed"
      );
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-[5px] border border-ink-900/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(236,255,248,0.92))] p-6 text-ink-900 shadow-[0_24px_90px_rgba(0,0,0,0.18)] sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-800/55">
              Campaign launcher
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Send approved template messages to one contact or a full audience batch.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-800/72">
              Approved templates are pulled directly from your library. Use `hello_world` if it is
              already approved in Meta, or choose any other template and we will surface the runtime
              fields needed for send.
            </p>
          </div>

          <div className="rounded-[5px] border border-emerald-200 bg-white/78 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-800/55">
              Ready to launch
            </div>
            <div className="mt-3 text-4xl font-black text-ink-900">{approvedTemplates.length}</div>
            <div className="mt-2 text-sm leading-6 text-ink-800/72">
              Approved templates available right now.
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {approvedTemplates.slice(0, 3).map((template) => (
                <Badge key={template._id} tone="good">
                  {template.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error ? <Alert>{error}</Alert> : null}
      {String(error || "").toLowerCase().includes("insufficient wallet balance") ? (
        <div className="rounded-[5px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Insufficient Wallet Balance. Recharge first to continue sending campaigns.
          <div className="mt-2">
            <Button size="sm" onClick={() => navigate("/app/wallet")}>
              Go to recharge
            </Button>
          </div>
        </div>
      ) : null}
      {ok ? (
        <div className="rounded-[5px] bg-brand-50 px-4 py-3 text-sm text-ink-900 ring-1 ring-brand-200">
          {ok}
        </div>
      ) : null}
      {lastWaId ? (
        <div className="rounded-[5px] border border-ink-900/10 bg-white px-4 py-3 text-sm text-ink-900">
          <div className="font-semibold">Delivery lifecycle</div>
          <div className="mt-1 break-all text-xs text-ink-800/70">WAMID: {lastWaId}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["accepted", "sent", "delivered", "read"] as const).map((step) => {
              const stepOrder = { accepted: 1, sent: 2, delivered: 3, read: 4, failed: 0 } as const;
              const done =
                lifecycleStatus !== "failed" &&
                stepOrder[step] <= (stepOrder[lifecycleStatus || "accepted"] || stepOrder.accepted);
              const failed = lifecycleStatus === "failed" && step !== "accepted";
              return (
                <span
                  key={step}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                    failed
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : done
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  {step}
                </span>
              );
            })}
            {lifecycleStatus === "failed" ? (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-rose-700">
                failed
              </span>
            ) : null}
          </div>
          <div className="mt-3 text-xs text-ink-800/70">
            {lifecyclePolling ? "Auto-refreshing status..." : "Auto-refresh paused."}
          </div>
          {lifecycleError ? <div className="mt-1 text-xs text-rose-700">{lifecycleError}</div> : null}
          {Object.keys(lifecycleTimestamps || {}).length > 0 ? (
            <div className="mt-2 text-xs text-ink-800/70">
              {Object.entries(lifecycleTimestamps).map(([k, v]) => (
                <div key={k}>
                  {k}: {String(v)}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/55">
            Single send
          </div>
          <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">
            Send from a contact-aware flow
          </div>

          <form className="mt-5 grid gap-4" onSubmit={sendOne}>
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                label="Approved template"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">Select approved template...</option>
                {approvedTemplates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name} ({template.language})
                  </option>
                ))}
              </Select>

              <Select
                label="Pick contact (optional)"
                value={selectedContactPhone}
                onChange={(e) => setSelectedContactPhone(e.target.value)}
              >
                <option value="">Manual phone entry</option>
                {contacts.map((contact) => (
                  <option key={contact._id} value={contact.phone}>
                    {contact.name || contact.phone}
                    {contact.company ? ` | ${contact.company}` : ""}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              label="To (WhatsApp phone)"
              value={to}
              type="tel"
              onChange={(e) => setTo(e.target.value)}
              placeholder="919999999999"
              required
            />

            {selectedTemplate ? (
              <div className="rounded-[5px] border border-ink-900/8 bg-slate-50/80 p-4 text-sm text-ink-800/76">
                <div className="font-semibold text-ink-900">{selectedTemplate.name}</div>
                <div className="mt-2">
                  {selectedTemplate.category} | {selectedTemplate.language} | {selectedTemplate.source || "local"}
                </div>
              </div>
            ) : null}

            {selectedTemplateSummary.headerVariableCount > 0 ? (
              <div className="grid gap-3">
                <Input
                  label={
                    selectedTemplateSummary.headerFormat === "IMAGE" ||
                    selectedTemplateSummary.headerFormat === "VIDEO" ||
                    selectedTemplateSummary.headerFormat === "DOCUMENT"
                      ? "Header media (URL or media ID)"
                      : `Header variables (${selectedTemplateSummary.headerVariableCount} required)`
                  }
                  value={headerVariables}
                  onChange={(e) => setHeaderVariables(e.target.value)}
                  placeholder={
                    selectedTemplateSummary.headerFormat === "IMAGE" ||
                    selectedTemplateSummary.headerFormat === "VIDEO" ||
                    selectedTemplateSummary.headerFormat === "DOCUMENT"
                      ? "Upload a file or paste a public https:// URL"
                      : "Festival sale"
                  }
                  hint={
                    selectedTemplateSummary.headerFormat === "IMAGE" ||
                    selectedTemplateSummary.headerFormat === "VIDEO" ||
                    selectedTemplateSummary.headerFormat === "DOCUMENT"
                      ? "For best reliability, upload a file here to get a media ID. URLs must be publicly accessible over https."
                      : undefined
                  }
                />

                {selectedTemplateSummary.headerFormat === "IMAGE" ||
                selectedTemplateSummary.headerFormat === "VIDEO" ||
                selectedTemplateSummary.headerFormat === "DOCUMENT" ? (
                  <div className="rounded-[5px] border border-ink-900/10 bg-slate-50 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs font-semibold text-ink-900/65">
                        {headerUploadBusy ? "Uploading header media…" : headerVariables.trim() ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700">
                            <CheckCircle2 size={14} /> Header media ready
                          </span>
                        ) : (
                          "Upload a header media file"
                        )}
                        {headerUploadError ? (
                          <div className="mt-1 text-[11px] font-medium text-red-700">{headerUploadError}</div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept={
                            selectedTemplateSummary.headerFormat === "IMAGE"
                              ? "image/*"
                              : selectedTemplateSummary.headerFormat === "VIDEO"
                              ? "video/*"
                              : "*/*"
                          }
                          className="hidden"
                          id="send-header-media"
                          onChange={async (ev) => {
                            const file = ev.target.files?.[0];
                            if (!file) return;
                            setHeaderUploadError(null);
                            setHeaderUploadPct(0);
                            setHeaderUploadBusy(true);
                            try {
                              const res = await API.messages.uploadMedia(file, (pct) => setHeaderUploadPct(pct));
                              setHeaderVariables(String(res?.mediaId || ""));
                              setHeaderUploadPct(100);
                            } catch (uploadErr: any) {
                              setHeaderUploadError(uploadErr?.response?.data?.details?.providerError || uploadErr?.response?.data?.message || "Upload failed");
                              setHeaderUploadPct(0);
                            } finally {
                              setHeaderUploadBusy(false);
                              // reset input so picking the same file again triggers onChange
                              ev.target.value = "";
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-[5px] bg-white border border-ink-900/10"
                          onClick={() => document.getElementById("send-header-media")?.click()}
                          disabled={headerUploadBusy}
                        >
                          <Upload size={14} /> {headerUploadBusy ? "Uploading…" : headerVariables.trim() ? "Replace" : "Upload"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-[5px] bg-white border border-ink-900/10"
                          onClick={() => { setHeaderVariables(""); setHeaderUploadPct(0); setHeaderUploadError(null); }}
                          disabled={headerUploadBusy}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    {headerUploadBusy || headerUploadPct > 0 ? (
                      <div className="mt-3">
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 transition-[width] duration-200"
                            style={{ width: `${Math.min(100, Math.max(0, headerUploadPct))}%` }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-ink-900/45">
                          <span>Upload progress</span>
                          <span>{headerUploadPct ? `${headerUploadPct}%` : ""}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {selectedTemplateSummary.bodyVariableCount > 0 ? (
              <Input
                label={`Body variables (${selectedTemplateSummary.bodyVariableCount} required)`}
                value={variables}
                onChange={(e) => setVariables(e.target.value)}
                placeholder="John, 123456"
              />
            ) : null}

            {selectedTemplateSummary.otpButtons > 0 ? (
              <Input
                label="OTP code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter OTP"
                required
              />
            ) : null}

            {selectedTemplateSummary.dynamicUrlButtons.length > 0 ||
            selectedTemplateSummary.copyCodeButtons.length > 0 ? (
              <Input
                label="Button values"
                value={buttonValues}
                onChange={(e) => setButtonValues(e.target.value)}
                placeholder="value1, value2"
                hint={[
                  ...selectedTemplateSummary.dynamicUrlButtons.map(
                    (button) => `${button.index + 1}: URL param for ${button.label}`
                  ),
                  ...selectedTemplateSummary.copyCodeButtons.map(
                    (button) => `${button.index + 1}: Offer code for ${button.label}`
                  ),
                ].join(" | ")}
              />
            ) : null}

            {selectedTemplateSummary.voiceCallButtons.length > 0 ? (
              <Input
                label="Call on WhatsApp validity (ttl_minutes)"
                value={buttonTtlMinutes}
                onChange={(e) => setButtonTtlMinutes(e.target.value)}
                placeholder="43200"
                hint={selectedTemplateSummary.voiceCallButtons
                  .map((button) => `${button.index + 1}: ${button.label} (max 43200)`)
                  .join(" | ")}
                required
              />
            ) : null}

            {selectedTemplateSummary.flowButtons.length > 0 ? (
              <>
                <Input
                  label="Flow tokens (optional)"
                  value={flowTokens}
                  onChange={(e) => setFlowTokens(e.target.value)}
                  placeholder="token1, token2"
                  hint={selectedTemplateSummary.flowButtons
                    .map((button) => `${button.index + 1}: ${button.label}`)
                    .join(" | ")}
                />
                <Textarea
                  label="Flow action data (optional, JSON)"
                  value={flowActionDataJson}
                  onChange={(e) => setFlowActionDataJson(e.target.value)}
                  className="min-h-24 font-mono text-xs"
                  hint='Example: {"key":"value"}'
                />
              </>
            ) : null}

            <Button type="submit" disabled={busy || !templateId}>
              {busy ? "Sending..." : "Send message"}
            </Button>
          </form>
        </Card>

        <div className="grid gap-5">
          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/55">
              Bulk JSON
            </div>
            <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">
              Broadcast payload
            </div>
            <div className="mt-2 text-sm text-ink-800/72">
              Use the same runtime fields supported in single send, including `headerVariables`,
              `variables`, `otpCode`, and `buttonValues`.
            </div>

            <form className="mt-5 grid gap-3" onSubmit={sendBulk}>
              <Textarea
                label="Payload (JSON)"
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                className="min-h-72 font-mono text-xs"
              />

              <Button type="submit" disabled={bulkBusy}>
                {bulkBusy ? "Sending..." : "Send bulk"}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/55">
              Best path
            </div>
            <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">
              Recommended flow
            </div>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-ink-800/74">
              <div className="rounded-[5px] bg-slate-50 px-4 py-3 ring-1 ring-ink-900/8">
                1. Import `hello_world` from the template library if it already exists in Meta.
              </div>
              <div className="rounded-[5px] bg-slate-50 px-4 py-3 ring-1 ring-ink-900/8">
                2. Add your audience in Contacts so sending and chatroom navigation stay simple.
              </div>
              <div className="rounded-[5px] bg-slate-50 px-4 py-3 ring-1 ring-ink-900/8">
                3. Use the Inbox page to continue conversations after the first approved template send.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
