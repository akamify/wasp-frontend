import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Cloud, FileSpreadsheet, Megaphone, X, AlertCircle } from "lucide-react";

import { API } from "../../api/api";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import { useToast } from "../../context/ToastContext";
import { inspectTemplate, parseCommaList, type TemplateRecord } from "../../utils/templateRuntime";
import { TemplatePreview } from "../../pages/templates/TemplatePreview";
import { parseComponentsForPreview, truncateTemplateName } from "../../pages/templates/helpers";

type CampaignType = "broadcast" | "csv" | "api";

type Contact = {
  _id: string;
  name?: string;
  phone: string;
  company?: string;
};

type CsvParsed = { headers: string[]; rows: Record<string, string>[] };

export default function CampaignCreateModal({
  isOpen,
  onClose,
  onSuccess,
  templates,
  contacts,
  initialType,
  initialSelectedPhones,
  initialName,
  lockRecipients,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  templates: TemplateRecord[];
  contacts: Contact[];
  initialType?: CampaignType | null;
  initialSelectedPhones?: string[];
  initialName?: string;
  lockRecipients?: boolean;
}) {
  function formatCurrency(value: unknown, currency = "INR") {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount)) return `0.00 ${currency}`;
    return `${amount.toFixed(2)} ${currency}`;
  }
  // Aisensy-like create flow (left config + right preview)
  const [type, setType] = useState<CampaignType | null>(null);
  const [limitsLoading, setLimitsLoading] = useState(false);
  const [messagingTierRaw, setMessagingTierRaw] = useState<string | null>(null);
  const [remainingQuotaRaw, setRemainingQuotaRaw] = useState<number | null>(null);
  const [messageType, setMessageType] = useState<"template" | "regular">("template");

  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [walletBalance, setWalletBalance] = useState<{ amount: number; currency: string } | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimate, setEstimate] = useState<{
    totalRecipients: number;
    billableRecipients: number;
    freeRecipients: number;
    estimatedCredits: number;
    walletBalance: number;
    currency: string;
    insufficientBalance: boolean;
  } | null>(null);

  const approvedTemplates = useMemo(() => templates.filter((t) => t.status === "approved"), [templates]);
  const selectedTemplate = useMemo(() => approvedTemplates.find((t) => t._id === templateId), [approvedTemplates, templateId]);
  const summary = useMemo(() => inspectTemplate(selectedTemplate), [selectedTemplate]);

  function missingBroadcastInputs() {
    if (type !== "broadcast" || !selectedTemplate) return [];
    const missing: string[] = [];

    if (summary.headerVariableCount > 0) {
      const required = summary.headerFormat === "TEXT" ? summary.headerVariableCount : 1;
      for (let i = 0; i < required; i += 1) {
        const v = String(headerVars[i] || "").trim();
        if (!v) missing.push(`Header {{${i + 1}}}`);
      }
    }

    if (summary.bodyVariableCount > 0) {
      for (let i = 0; i < summary.bodyVariableCount; i += 1) {
        const v = String(bodyVars[i] || "").trim();
        if (!v) missing.push(`Body {{${i + 1}}}`);
      }
    }

    if (buttonsNeedingValue.length > 0) {
      for (const btn of buttonsNeedingValue) {
        const v = String(buttonValueByIndex[btn.index] ?? "").trim();
        if (!v) missing.push(`${btn.label} (Button ${btn.index + 1})`);
      }
    }

    if (summary.otpButtons > 0) {
      const v = String(otpCode || "").trim();
      if (!v) missing.push("OTP code");
    }

    return missing;
  }

  const tierInfo = useMemo(() => {
    const raw = String(messagingTierRaw || "").trim();
    if (!raw) return null;

    const upper = raw.toUpperCase();
    const tierLabel =
      upper.includes("TIER_") ? upper.replace(/^.*TIER_/, "Tier ").replace(/_/g, " ") : raw;

    const match = upper.match(/(\d+)\s*(K|M)?/);
    let limit = match ? Number(match[1]) : NaN;
    const suffix = match?.[2] || "";
    if (suffix === "K") limit *= 1000;
    if (suffix === "M") limit *= 1000 * 1000;
    if (!Number.isFinite(limit) || limit <= 0) limit = NaN;

    return {
      tierLabel,
      limitPer24h: Number.isFinite(limit) ? limit : null,
      // Meta does not provide a reliable "remaining quota" field via Graph for all accounts.
      // We display an estimate; when unknown we fallback to tier limit.
      remainingQuota: remainingQuotaRaw ?? (Number.isFinite(limit) ? limit : null),
    };
  }, [messagingTierRaw, remainingQuotaRaw]);

  useEffect(() => {
    if (!isOpen) return;
    setLimitsLoading(true);
    (async () => {
      try {
        const [metaRes, walletRes] = await Promise.all([
          API.meta.status(),
          API.wallet.get()
        ]);
        
        const tier = metaRes?.limits?.messagingLimitTier ? String(metaRes.limits.messagingLimitTier) : null;
        setMessagingTierRaw(tier);
        setRemainingQuotaRaw(null);
        
        if (walletRes?.wallet) {
          setWalletBalance({
            amount: walletRes.wallet.balance || 0,
            currency: walletRes.wallet.currency || "INR"
          });
        }
      } catch {
        setMessagingTierRaw(null);
        setRemainingQuotaRaw(null);
      } finally {
        setLimitsLoading(false);
      }
    })();
  }, [isOpen]);

  const [contactQuery, setContactQuery] = useState("");
  const [selectedPhones, setSelectedPhones] = useState<Record<string, true>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (initialType !== undefined) setType(initialType ?? null);
    if (initialName !== undefined) setName(String(initialName || ""));
    if (initialSelectedPhones !== undefined) {
      setSelectedPhones(() => {
        const next: Record<string, true> = {};
        (initialSelectedPhones || []).forEach((p) => {
          const phone = String(p || "").replace(/\D/g, "");
          if (phone) next[phone] = true;
        });
        return next;
      });
    }
    // Keep the rest of the flow “start from template selection”.
    setTemplateId("");
    setScheduledAt("");
  }, [isOpen, initialType, initialName, initialSelectedPhones]);

  const [headerVars, setHeaderVars] = useState<string[]>([]);
  const [bodyVars, setBodyVars] = useState<string[]>([]);
  const [otpCode, setOtpCode] = useState("");
  const [buttonValues, setButtonValues] = useState<string[]>([]);
  const [buttonValueByIndex, setButtonValueByIndex] = useState<Record<number, string>>({});
  const [buttonTtlMinutes, setButtonTtlMinutes] = useState<number[]>([]);
  const [flowTokens, setFlowTokens] = useState<string[]>([]);
  const [flowActionDataJson, setFlowActionDataJson] = useState("{}");

  const [csvBusy, setCsvBusy] = useState(false);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [csvPhoneColumn, setCsvPhoneColumn] = useState("");
  const [csvBodyMap, setCsvBodyMap] = useState<string[]>([]);
  const [csvHeaderMap, setCsvHeaderMap] = useState<string[]>([]);
  const [csvButtonMap, setCsvButtonMap] = useState<string[]>([]);

  const [demoTo, setDemoTo] = useState("");
  const [demoBusy, setDemoBusy] = useState(false);
  const [headerMediaUploading, setHeaderMediaUploading] = useState(false);
  const [headerMediaOverride, setHeaderMediaOverride] = useState<string>("");

  const buttonsNeedingValue = useMemo(() => {
    const all = [...summary.dynamicUrlButtons, ...summary.copyCodeButtons];
    const seen = new Set<number>();
    return all.filter((b) => {
      if (seen.has(b.index)) return false;
      seen.add(b.index);
      return true;
    });
  }, [summary.dynamicUrlButtons, summary.copyCodeButtons]);

  const resolvedButtonValues = useMemo(() => {
    if (!buttonsNeedingValue.length) return buttonValues;
    const out = [...buttonValues];
    buttonsNeedingValue.forEach((button) => {
      const nextValue = String(buttonValueByIndex[button.index] ?? "").trim();
      if (nextValue) out[button.index] = nextValue;
    });
    return out;
  }, [buttonValues, buttonValueByIndex, buttonsNeedingValue]);

  function digitsOnly(value: string) {
    return String(value || "").replace(/\D/g, "");
  }

  function parseCsvText(text: string, maxRows = 5000): CsvParsed {
    const lines = String(text || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return { headers: [], rows: [] };

    const headers = lines[0].split(",").map((h) => h.trim()).filter(Boolean);
    const rows = lines.slice(1, 1 + maxRows).map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = parts[i] ?? "";
      });
      return obj;
    });

    return { headers, rows };
  }

  // Preview uses the shared `TemplatePreview` component (same as Templates page).

  const csvParsed = useMemo(() => parseCsvText(csvText, 5000), [csvText]);
  const csvColumns = useMemo(() => csvParsed.headers, [csvParsed.headers]);
  const csvFirstRow = useMemo(() => (csvParsed.rows.length ? csvParsed.rows[0] : null), [csvParsed.rows]);

  const filteredContacts = useMemo(() => {
    const q = contactQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => `${c.name || ""} ${c.phone} ${c.company || ""}`.toLowerCase().includes(q));
  }, [contacts, contactQuery]);

  const audienceCount = useMemo(() => {
    if (type === "csv") return csvParsed.rows.length;
    if (type === "broadcast") return Object.keys(selectedPhones).length;
    return 0;
  }, [type, csvParsed.rows.length, selectedPhones]);

  const csvPreviewData = useMemo(() => {
    if (!csvFirstRow) return { to: "", variables: [] as string[], headerVariables: [] as string[] };
    const to = digitsOnly(String((csvFirstRow as any)[csvPhoneColumn] ?? ""));
    const variables = csvBodyMap.map((col) => (col ? String((csvFirstRow as any)[col] ?? "") : ""));
    const headerVariables = csvHeaderMap.map((col) => (col ? String((csvFirstRow as any)[col] ?? "") : ""));
    return { to, variables, headerVariables };
  }, [csvFirstRow, csvPhoneColumn, csvBodyMap, csvHeaderMap]);

  const templatePreviewProps = useMemo(() => {
    const t = selectedTemplate;
    const category = (t?.category || "utility") as any;
    const parsed = parseComponentsForPreview(t?.components);

    const values = type === "csv" ? csvPreviewData.variables : bodyVars;
    const headerValues = type === "csv" ? csvPreviewData.headerVariables : headerVars;

    const variableValues: Record<number, string> = {};
    values.forEach((v, i) => {
      variableValues[i + 1] = String(v ?? "");
    });

    const headerVariableValues: Record<number, string> = {};
    headerValues.forEach((v, i) => {
      headerVariableValues[i + 1] = String(v ?? "");
    });

    const overrideHandle =
      parsed.headerType === "IMAGE" || parsed.headerType === "VIDEO" || parsed.headerType === "DOCUMENT"
        ? String(headerMediaOverride || headerValues[0] || "").trim()
        : "";
    const effectiveMediaHandle = overrideHandle || parsed.mediaHandle;
    const mediaPreviewUrl = /^https?:\/\//i.test(effectiveMediaHandle) ? effectiveMediaHandle : null;

    return {
      category,
      headerType: parsed.headerType,
      headerText: parsed.headerText,
      mediaHandle: effectiveMediaHandle,
      mediaPreviewUrl,
      mediaMeta: null,
      headerLocation: parsed.headerLocation,
      headerVariableValues,
      bodyText: parsed.bodyText,
      footerText: parsed.footerText,
      ctaButtons: parsed.ctaButtons,
      variableValues,
      authConfig: parsed.authConfig
        ? {
            otpType: parsed.authConfig.otpType,
            expiresInMinutes: parsed.authConfig.expiresInMinutes,
            addSecurityRecommendation: parsed.authConfig.addSecurityRecommendation,
            includeExpirationWarning: parsed.authConfig.includeExpirationWarning,
          }
        : null,
    };
  }, [selectedTemplate, type, csvPreviewData.variables, csvPreviewData.headerVariables, bodyVars, headerVars, headerMediaOverride]);

  function autoMapCsvIfEmpty(columns: string[]) {
    if (!columns.length) return;
    const colsLower = columns.map((c) => c.toLowerCase());
    const norm = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
    const findCol = (wants: string[]) => {
      for (const want of wants) {
        const w = norm(want);
        const idx = colsLower.findIndex((c) => norm(c) === w || norm(c).includes(w));
        if (idx >= 0) return columns[idx];
      }
      return "";
    };

    setCsvPhoneColumn((prev) => {
      if (String(prev || "").trim()) return prev;
      return findCol(["phone", "phonenumber", "mobile", "msisdn", "to", "number", "whatsapp", "wa", "waid", "contact"]);
    });

    setCsvBodyMap((prev) => {
      const shouldAutofill = !prev.some((x) => String(x || "").trim());
      if (!shouldAutofill) return prev;

      // 1) Try explicit positional naming (var1, variable1, body1, param1, etc.)
      const byIndex = Array.from({ length: summary.bodyVariableCount }, (_, i) => {
        const n = i + 1;
        const candidates = [
          `var${n}`,
          `variable${n}`,
          `body${n}`,
          `param${n}`,
          `parameter${n}`,
          `field${n}`,
          `col${n}`,
        ];
        const direct = findCol(candidates);
        if (direct) return direct;
        if (n === 1) return findCol(["name", "firstname", "first_name", "fullname"]);
        if (n === 2) return findCol(["orderid", "order_id", "order", "invoice", "amount"]);
        if (n === 3) return findCol(["coupon", "code", "offer", "discount"]);
        if (n === 4) return findCol(["link", "url"]);
        return "";
      });

      // 2) Fallback: map remaining columns by appearance (excluding phone column)
      const phone = csvPhoneColumn || findCol(["phone", "phonenumber", "mobile", "msisdn", "to"]);
      const remaining = columns.filter((c) => c !== phone);
      const allEmpty = byIndex.every((v) => !String(v || "").trim());
      if (!allEmpty) return byIndex;
      return Array.from({ length: summary.bodyVariableCount }, (_, i) => remaining[i] || "");
    });

    setCsvHeaderMap((prev) => {
      const shouldAutofill = !prev.some((x) => String(x || "").trim());
      if (!shouldAutofill) return prev;

      const byIndex = Array.from({ length: summary.headerVariableCount }, (_, i) => {
        const n = i + 1;
        const candidates = [
          `header${n}`,
          `headervar${n}`,
          `header_variable${n}`,
          `h${n}`,
          `media`,
          `mediaurl`,
          `image`,
          `imageurl`,
          `document`,
          `doc`,
          `video`,
        ];
        const direct = findCol(candidates);
        return direct || "";
      });
      return byIndex;
    });
  }

  useEffect(() => {
    if (!isOpen) return;
    const hasSeed =
      initialType !== undefined ||
      initialName !== undefined ||
      (Array.isArray(initialSelectedPhones) && initialSelectedPhones.length > 0);

    if (!hasSeed) {
      setType(null);
      setName("");
      setContactQuery("");
      setSelectedPhones({});
    }
    setMessageType("template");
    setTemplateId("");
    setScheduledAt("");
    setHeaderVars([]);
    setBodyVars([]);
    setOtpCode("");
    setButtonValues([]);
    setButtonValueByIndex({});
    setButtonTtlMinutes([]);
    setFlowTokens([]);
    setFlowActionDataJson("{}");
    setCsvBusy(false);
    setCsvFileName("");
    setCsvText("");
    setCsvPhoneColumn("");
    setCsvBodyMap([]);
    setCsvHeaderMap([]);
    setDemoTo("");
    setDemoBusy(false);
  }, [isOpen, initialType, initialName, initialSelectedPhones]);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedTemplate) return;
    setHeaderVars((prev) =>
      prev.length === summary.headerVariableCount ? prev : Array.from({ length: summary.headerVariableCount }, (_, i) => prev[i] || "")
    );
    setBodyVars((prev) =>
      prev.length === summary.bodyVariableCount ? prev : Array.from({ length: summary.bodyVariableCount }, (_, i) => prev[i] || "")
    );
    if (summary.voiceCallButtons.length > 0 && buttonTtlMinutes.length === 0) setButtonTtlMinutes(summary.voiceCallButtons.map(() => 43200));
    setCsvBodyMap((prev) =>
      prev.length === summary.bodyVariableCount ? prev : Array.from({ length: summary.bodyVariableCount }, (_, i) => prev[i] || "")
    );
    setCsvHeaderMap((prev) =>
      prev.length === summary.headerVariableCount ? prev : Array.from({ length: summary.headerVariableCount }, (_, i) => prev[i] || "")
    );
    setCsvButtonMap((prev) =>
      prev.length === buttonsNeedingValue.length ? prev : Array.from({ length: buttonsNeedingValue.length }, (_, i) => prev[i] || "")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, templateId]);

  useEffect(() => {
    if (!isOpen || !buttonsNeedingValue.length) return;
    setButtonValueByIndex((prev) => {
      const next: Record<number, string> = {};
      buttonsNeedingValue.forEach((btn) => {
        next[btn.index] = String(prev[btn.index] ?? buttonValues[btn.index] ?? "");
      });
      return next;
    });
  }, [isOpen, buttonsNeedingValue, buttonValues]);

  useEffect(() => {
    if (!isOpen) return;
    if (type !== "csv") return;
    if (!csvColumns.length) return;
    autoMapCsvIfEmpty(csvColumns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, type, csvColumns.join("|"), summary.bodyVariableCount, summary.headerVariableCount]);

  async function demoSend() {
    const to = digitsOnly(demoTo);
    if (!to) throw new Error("Enter a demo WhatsApp number");
    if (!templateId) throw new Error("Select a template first");

    const data = type === "csv" ? csvPreviewData : { variables: bodyVars, headerVariables: headerVars };
    const effectiveHeaderVariables =
      summary.headerFormat !== "TEXT" && headerMediaOverride
        ? [headerMediaOverride, ...(data.headerVariables || []).slice(1)]
        : data.headerVariables;
    const effectiveButtonValues =
      type === "csv" && csvFirstRow
        ? (() => {
            const out = [...resolvedButtonValues];
            buttonsNeedingValue.forEach((btn, mapIndex) => {
              const col = csvButtonMap[mapIndex];
              if (!col) return;
              out[btn.index] = String((csvFirstRow as any)[col] ?? "");
            });
            return out;
          })()
        : resolvedButtonValues;

    const payload: any = {
      templateId,
      to,
      variables: data.variables,
      headerVariables: effectiveHeaderVariables,
      otpCode: String(otpCode || "").trim() || undefined,
      buttonValues: effectiveButtonValues,
      buttonTtlMinutes,
      flowTokens,
    };
    try {
      const parsed = JSON.parse(flowActionDataJson || "{}");
      payload.flowActionData = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      payload.flowActionData = [];
    }
    await API.messages.send(payload);
    toast("Demo message sent successfully", "success");
  }

  async function createCampaign() {
    setBusy(true);
    try {
      if (!type) throw new Error("Select a campaign type");
      if (messageType !== "template") throw new Error("Regular message mode not implemented yet");
      const campaignName = name.trim();
      if (!campaignName) throw new Error("Campaign name is required");
      if (!templateId) throw new Error("Select a template");

      const scheduled = scheduledAt.trim() ? new Date(scheduledAt).toISOString() : undefined;

      if (type === "api") {
        await API.campaigns.create({ name: campaignName, type, templateId, scheduledAt: scheduled });
        toast("API campaign created. Your integration will provide contacts at send time.", "success");
        onSuccess();
        onClose();
        return;
      }

      const recipients = buildRecipientsForCurrentState();
      if (!recipients.length) throw new Error("Select at least one valid recipient");
      if (type === "broadcast") {
        const missing = missingBroadcastInputs();
        if (missing.length) {
          throw new Error(
            `Broadcast template needs values for: ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? "..." : ""} (Use CSV for per-contact variables)`
          );
        }
      }
      if (estimate?.insufficientBalance) {
        throw new Error(
          `Insufficient balance: need ${formatCurrency(estimate.estimatedCredits, estimate.currency)}, available ${formatCurrency(estimate.walletBalance, estimate.currency)}`
        );
      }

      await API.campaigns.create({ name: campaignName, type, templateId, scheduledAt: scheduled, recipients });

      toast("Campaign created successfully", "success");
      onSuccess();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to create campaign";
      toast(msg, "error");
    } finally {
      setBusy(false);
    }
  }

  function buildRecipientsForCurrentState(): Array<any> {
    if (!type || type === "api") return [];
    if (!templateId) return [];
    if (type === "broadcast") {
      const phones = Object.keys(selectedPhones || {});
      const effectiveHeaderVariables =
        summary.headerFormat !== "TEXT" && headerMediaOverride
          ? [headerMediaOverride, ...headerVars.slice(1)]
          : headerVars;
      return phones.map((to) => ({
        to,
        variables: bodyVars,
        headerVariables: effectiveHeaderVariables,
        otpCode: String(otpCode || "").trim() || undefined,
        buttonValues: resolvedButtonValues,
        buttonTtlMinutes,
        flowTokens,
        flowActionData: (() => {
          try {
            const parsed = JSON.parse(flowActionDataJson || "{}");
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            return [];
          }
        })(),
      }));
    }

    if (!csvParsed.rows.length || !csvPhoneColumn) return [];
    const csvFlowActionData = (() => {
      try {
        const parsed = JSON.parse(flowActionDataJson || "{}");
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [];
      }
    })();
    return csvParsed.rows
      .map((row) => {
        const to = digitsOnly(String(row[csvPhoneColumn] ?? ""));
        if (!to) return null;
        const rowHeaderVariables = csvHeaderMap.map((col) => (col ? String(row[col] ?? "") : ""));
        const effectiveHeaderVariables =
          summary.headerFormat !== "TEXT" && headerMediaOverride
            ? [headerMediaOverride, ...rowHeaderVariables.slice(1)]
            : rowHeaderVariables;
        const rowButtonValues = (() => {
          const out = [...resolvedButtonValues];
          buttonsNeedingValue.forEach((btn, mapIndex) => {
            const col = csvButtonMap[mapIndex];
            if (!col) return;
            out[btn.index] = String(row[col] ?? "");
          });
          return out;
        })();
        return {
          to,
          variables: csvBodyMap.map((col) => (col ? String(row[col] ?? "") : "")),
          headerVariables: effectiveHeaderVariables,
          otpCode: String(otpCode || "").trim() || undefined,
          buttonValues: rowButtonValues,
          buttonTtlMinutes,
          flowTokens,
          flowActionData: csvFlowActionData,
        };
      })
      .filter(Boolean) as Array<any>;
  }

  useEffect(() => {
    if (!isOpen || !type || type === "api" || !templateId) {
      setEstimate(null);
      return;
    }
    const recipients = buildRecipientsForCurrentState();
    if (!recipients.length) {
      setEstimate(null);
      return;
    }

    let alive = true;
    const timer = window.setTimeout(async () => {
      setEstimateLoading(true);
      try {
        const res = await API.campaigns.estimate({ templateId, recipients });
        if (!alive) return;
        const est = res?.estimate || null;
        setEstimate(est);
        if (est?.walletBalance !== undefined) {
          setWalletBalance({ amount: est.walletBalance, currency: est.currency || "INR" });
        }
      } catch (e: any) {
        if (alive) {
          setEstimate(null);
          const msg = e?.response?.data?.message || e?.message || "Failed to calculate campaign estimate";
          toast(msg, "error");
        }
      } finally {
        if (alive) setEstimateLoading(false);
      }
    }, 350);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    type,
    templateId,
    selectedPhones,
    csvText,
    csvPhoneColumn,
    csvBodyMap,
    csvHeaderMap,
    csvButtonMap,
    headerVars,
    bodyVars,
    resolvedButtonValues,
    headerMediaOverride,
    otpCode,
    flowActionDataJson,
    buttonTtlMinutes,
    flowTokens,
    summary.headerFormat,
  ]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white rounded-[5px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-ink-900/5 bg-slate-50/50 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-black text-ink-900">Create New Campaign</h2>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-800/40">Launch your message to the world</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-ink-900/5 rounded-[5px] transition-colors" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Errors are now handled exclusively via Toasts for a cleaner UI */}

          {!type ? (
            <div className="flex flex-col items-center justify-center py-2">
              <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-3">
                {[
                  { id: "broadcast" as const, title: "Broadcast", icon: <Megaphone size={22} />, desc: "Select from your contacts and send static messages." },
                  { id: "csv" as const, title: "CSV Upload", icon: <FileSpreadsheet size={22} />, desc: "Upload a CSV file with variables for personalized reach." },
                  { id: "api" as const, title: "API Driven", icon: <Cloud size={22} />, desc: "Trigger messages via our high-speed developer API." },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className="flex flex-col p-6 cursor-pointer text-left rounded-[5px] border-2 border-ink-900/5 bg-white hover:border-brand-600 hover:shadow-xl hover:shadow-brand-600/5 transition-all group relative overflow-hidden"
                  >
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[5px] bg-slate-50 text-ink-900 group-hover:bg-brand-600 group-hover:text-white transition-all">
                      {t.icon}
                    </div>
                    <div className="text-base font-black text-ink-900 group-hover:text-brand-600 transition-colors">{t.title}</div>
                    <div className="mt-2 text-xs font-medium leading-relaxed text-ink-800/60">{t.desc}</div>
                    <div className="mt-6 flex items-center text-[10px] font-black uppercase tracking-widest text-brand-600 opacity-0 group-hover:opacity-100 transition-all">
                      Select Type →
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-[5px] border border-ink-900/5 bg-slate-50/50 px-6 py-5">
                <div className="grid gap-6 sm:grid-cols-5">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-ink-800/40">Messaging Tier</div>
                    <div className="mt-1.5 text-sm font-black text-ink-900">
                      {limitsLoading ? <span className="animate-pulse opacity-50">...</span> : tierInfo?.tierLabel || "—"}
                    </div>
                    <div className="mt-0.5 text-[10px] font-bold text-ink-800/60">
                      {tierInfo?.limitPer24h ? `(${tierInfo.limitPer24h.toLocaleString()} / 24h)` : "Limit unknown"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-ink-800/40">Remaining</div>
                    <div className="mt-1.5 text-sm font-black text-ink-900">
                      {limitsLoading ? "—" : tierInfo?.remainingQuota ? tierInfo.remainingQuota.toLocaleString() : "—"}
                    </div>
                    <div className="mt-0.5 text-[10px] font-bold text-ink-800/60">approx. quota</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-ink-800/40">Audience</div>
                    <div className="mt-1.5 text-sm font-black text-ink-900">{audienceCount.toLocaleString()}</div>
                    <div className="mt-0.5 text-[10px] font-bold text-ink-800/60">recipients</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-ink-800/40">Est. Credits</div>
                    <div className="mt-1.5 text-sm font-black text-ink-900">
                      {estimateLoading ? <span className="animate-pulse opacity-50">...</span> : estimate ? formatCurrency(estimate.estimatedCredits, estimate.currency) : "—"}
                    </div>
                    <div className="mt-0.5 text-[10px] font-bold text-ink-800/60">
                      {estimate ? `${estimate.billableRecipients} billable` : ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-ink-800/40">Your Balance</div>
                    <div className="mt-1.5 text-sm font-black text-ink-900">
                      {walletBalance ? formatCurrency(walletBalance.amount, walletBalance.currency) : "—"}
                    </div>
                    <div className={`mt-0.5 text-[10px] font-black uppercase ${estimate?.insufficientBalance ? "text-rose-600" : "text-emerald-600"}`}>
                      {estimate?.insufficientBalance ? "Insufficient Funds" : walletBalance ? "" : ""}
                    </div>
                  </div>
                </div>
                {estimate?.insufficientBalance ? (
                  <div className="mt-4 flex items-center gap-3 rounded-[5px] border border-rose-200 bg-rose-50 px-4 py-3">
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                    <div className="text-xs font-bold text-rose-700">
                      Insufficient balance for this campaign. Please recharge your wallet to continue.
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_360px]">
                <div className="grid gap-4">
                  <Card className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge tone="neutral" className="px-3 py-1 capitalize font-black">{type}</Badge>
                      </div>
                      <button onClick={() => setType(null)} className="text-[10px] font-black uppercase tracking-widest text-brand-600 hover:underline">Change Type</button>
                    </div>

                    <div className="mt-6 grid gap-6 md:grid-row-2">
                      <div className="space-y-4">
                        <Input 
                          label="Campaign Name" 
                          placeholder="e.g. Summer Sale 2026" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          required 
                        />
                        <Input 
                          label="Schedule (optional)" 
                          type="datetime-local" 
                          value={scheduledAt} 
                          onChange={(e) => setScheduledAt(e.target.value)} 
                        />
                      </div>
                    </div>
                      <div className="space-y-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-ink-800/40">Select Template</div>
                        <Select 
                          value={templateId} 
                          onChange={(e) => setTemplateId(e.target.value)} 
                          required
                          className="mt-1"
                        >
                          <option value="">Select approved template...</option>
                          {approvedTemplates.map((t) => (
                            <option key={t._id} value={t._id}>
                              {truncateTemplateName(t.name)} ({t.language})
                            </option>
                          ))}
                        </Select>
                        <div className="text-[10px] font-bold text-ink-800/40 italic">
                          Only approved templates can be used for campaigns.
                        </div>
                      </div>
                  </Card>

                  {type === "broadcast" ? (
                    <Card className="p-6">
                      <div className="text-xs font-semibold uppercase tracking-wider text-ink-800/50">Audience</div>
                      <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">
                        {lockRecipients ? "Selected failed recipients" : "Select contacts"}
                      </div>
                      {lockRecipients ? (
                        <div className="mt-4 rounded-[5px] border border-ink-900/10 bg-slate-50 p-4">
                          <div className="text-sm font-black text-ink-900">
                            {Object.keys(selectedPhones || {}).length.toLocaleString()} recipients locked
                          </div>
                          <div className="mt-1 text-xs text-ink-800/70">
                            Recipients can’t be changed here. You can change campaign name and template.
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {Object.keys(selectedPhones || {})
                              .slice(0, 10)
                              .map((p) => (
                                <span
                                  key={p}
                                  className="rounded-full bg-white px-3 py-1 text-[10px] font-black tracking-widest text-ink-900 ring-1 ring-ink-900/10"
                                >
                                  +{p}
                                </span>
                              ))}
                            {Object.keys(selectedPhones || {}).length > 10 ? (
                              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black tracking-widest text-ink-900 ring-1 ring-ink-900/10">
                                +{Object.keys(selectedPhones || {}).length - 10} more
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {!lockRecipients ? (
                        <div className="mt-4">
                          <Input label="Search contacts" value={contactQuery} onChange={(e) => setContactQuery(e.target.value)} placeholder="Search name or phone" />
                        </div>
                      ) : null}
                      {!lockRecipients ? (
                        <div className="mt-4 max-h-64 overflow-auto rounded-[5px] border border-ink-900/10 bg-white divide-y divide-ink-900/5">
                        {filteredContacts.slice(0, 300).map((c) => {
                          const checked = !!selectedPhones[c.phone];
                          return (
                            <label key={c._id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-ink-900">{c.name || c.phone}</div>
                                <div className="mt-0.5 truncate text-xs text-ink-800/65">{c.phone}{c.company ? ` • ${c.company}` : ""}</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setSelectedPhones((prev) => {
                                    const next = { ...prev };
                                    if (checked) delete next[c.phone];
                                    else next[c.phone] = true;
                                    return next;
                                  })
                                }
                              />
                            </label>
                          );
                        })}
                        {!filteredContacts.length ? <div className="px-4 py-6 text-sm text-ink-800/70">No contacts found.</div> : null}
                      </div>
                      ) : null}
                    </Card>
                  ) : null}

                  {type === "broadcast" ? (
                    <Card className="p-6">
                      <div className="text-xs font-semibold uppercase tracking-wider text-ink-800/50">Parameters</div>
                      <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">Template variables</div>
                      {summary.headerVariableCount > 0 ? (
                        <div className="mt-4 rounded-[5px] border border-ink-900/10 bg-white p-4">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-800/55">
                            Header variables
                          </div>
                          <div className="mt-1 text-xs text-ink-800/65">
                            {summary.headerFormat === "TEXT"
                              ? `These values fill Header ${"{{1}}"} (max 1 variable).`
                              : "This value is used for the header media handle/link."}
                          </div>

                          {summary.headerFormat !== "TEXT" ? (
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[5px] border border-ink-900/10 bg-slate-50 px-3 py-2">
                              <div className="text-xs font-semibold text-ink-800/70">
                                Upload local media to get a Media ID (recommended)
                              </div>
                              <input
                                type="file"
                                accept="image/*,video/*,application/pdf"
                                className="hidden"
                                id="campaigns-header-media-upload"
                                onChange={async (ev) => {
                                  const file = ev.target.files?.[0];
                                  if (!file) return;
                                  setHeaderMediaUploading(true);
                                  // error cleared
                                  try {
                                    const res = await API.messages.uploadMedia(file);
                                    const id = String(res?.mediaId || "").trim();
                                    if (!id) throw new Error("Media upload failed: no mediaId returned");
                                    setHeaderMediaOverride(id);
                                    setHeaderVars((prev) => {
                                      const next = prev.length ? [...prev] : [""];
                                      next[0] = id;
                                      return next;
                                    });
                                  } catch (e: any) {
                                    toast(e?.response?.data?.message || e?.message || "Media upload failed", "error");
                                  } finally {
                                    setHeaderMediaUploading(false);
                                    ev.target.value = "";
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="rounded-[5px] bg-white border border-ink-900/10"
                                disabled={headerMediaUploading}
                                onClick={() => document.getElementById("campaigns-header-media-upload")?.click()}
                              >
                                {headerMediaUploading ? "Uploading..." : "Upload"}
                              </Button>
                            </div>
                          ) : null}

                          <div className="mt-3 grid gap-3">
                            {headerVars.map((v, i) => (
                              <Input
                                key={i}
                                label={`Header {{${i + 1}}}`}
                                value={v}
                                onChange={(e) =>
                                  setHeaderVars((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))
                                }
                                placeholder={summary.headerFormat === "TEXT" ? "e.g. Shivam" : "media handle or https:// link"}
                                required={type === "broadcast" && i < (summary.headerFormat === "TEXT" ? summary.headerVariableCount : 1)}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {summary.bodyVariableCount > 0 ? (
                        <div className="mt-5 rounded-[5px] border border-ink-900/10 bg-white p-4">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-800/55">
                            Body variables
                          </div>
                          <div className="mt-1 text-xs text-ink-800/65">
                            These values fill Body {"{{1}}"}, {"{{2}}"}, ... in your message.
                          </div>
                          {type === "broadcast" ? (
                            <div className="mt-3 rounded-[5px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900/80">
                              Broadcast sends the same variables to everyone. For personalized variables per contact, use CSV Upload.
                            </div>
                          ) : null}
                          <div className="mt-3 grid gap-3">
                            {bodyVars.map((v, i) => (
                              <Input
                                key={i}
                                label={`Body {{${i + 1}}}`}
                                value={v}
                                onChange={(e) =>
                                  setBodyVars((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))
                                }
                                required={type === "broadcast"}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {summary.otpButtons > 0 ? (
                        <div className="mt-5">
                          <Input label="OTP code" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="123456" required />
                        </div>
                      ) : null}
                      {summary.dynamicUrlButtons.length > 0 || summary.copyCodeButtons.length > 0 ? (
                        <div className="mt-5 rounded-[5px] border border-ink-900/10 bg-white p-4">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-800/55">
                            Button variables
                          </div>
                          <div className="mt-1 text-xs text-ink-800/65">
                            Dynamic URL me sirf variable part do (full URL nahi), jaise: {"{product-slug}"}.
                          </div>
                          <div className="mt-3 grid gap-3">
                            {buttonsNeedingValue.map((btn, i) => (
                              <Input
                                key={`${btn.index}-${i}`}
                                label={`${btn.label} (Button ${btn.index + 1})`}
                                value={String(buttonValueByIndex[btn.index] ?? "")}
                                onChange={(e) =>
                                  setButtonValueByIndex((prev) => ({
                                    ...prev,
                                    [btn.index]: e.target.value,
                                  }))
                                }
                                placeholder={summary.dynamicUrlButtons.some((b) => b.index === btn.index) ? "e.g. offer-2026 (not full URL)" : "Enter value"}
                                required={type === "broadcast"}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {summary.voiceCallButtons.length > 0 ? (
                        <div className="mt-5">
                          <Input
                            label="Call validity (ttl_minutes)"
                            value={buttonTtlMinutes.join(", ")}
                            onChange={(e) =>
                              setButtonTtlMinutes(
                                parseCommaList(e.target.value).map((x) => Number(x)).filter((n) => !Number.isNaN(n))
                              )
                            }
                            placeholder="43200"
                            required
                          />
                        </div>
                      ) : null}
                      {summary.flowButtons.length > 0 ? (
                        <div className="mt-5 grid gap-3">
                          <Input label="Flow tokens" value={flowTokens.join(", ")} onChange={(e) => setFlowTokens(parseCommaList(e.target.value))} />
                          <Textarea label="Flow action data (JSON)" value={flowActionDataJson} onChange={(e) => setFlowActionDataJson(e.target.value)} className="min-h-24 font-mono text-xs" />
                        </div>
                      ) : null}
                    </Card>
                  ) : null}

                  {type === "csv" ? (
                    <Card className="p-6">
                      <div className="text-xs font-semibold uppercase tracking-wider text-ink-800/50">CSV</div>
                      <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">Upload & map</div>
                      <div className="mt-4 rounded-[5px] border border-ink-900/10 bg-slate-50 px-4 py-3">
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          className="hidden"
                          id="campaigns-create-csv"
                          onChange={async (ev) => {
                            const file = ev.target.files?.[0];
                            if (!file) return;
                            setCsvBusy(true);
                            try {
                              setCsvFileName(file.name);
                              const text = await file.text();
                              setCsvText(text);
                            } finally {
                              setCsvBusy(false);
                              ev.target.value = "";
                            }
                          }}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-ink-900">{csvFileName ? csvFileName : "Choose a CSV file"}</div>
                          <Button type="button" size="sm" variant="ghost" className="rounded-[7px] bg-white border border-ink-900/10" onClick={() => document.getElementById("campaigns-create-csv")?.click()}>
                            <FileSpreadsheet size={14} /> {csvBusy ? "Loading..." : "Upload"}
                          </Button>
                        </div>
                        <div className="mt-2 text-xs text-ink-800/70">Auto-map runs when mapping is empty.</div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-1">
                        <Select label="Phone column" value={csvPhoneColumn} onChange={(e) => setCsvPhoneColumn(e.target.value)} disabled={!csvColumns.length}>
                          <option value="">Select column...</option>
                          {csvColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                        </Select>
                      </div>
                      {summary.headerVariableCount > 0 ? (
                        <div className="mt-5 grid gap-3 md:grid-cols-1">
                          {csvHeaderMap.map((col, i) => (
                            <Select key={i} label={`Header {{${i + 1}}}`} value={col} onChange={(e) => setCsvHeaderMap((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))} disabled={!csvColumns.length}>
                              <option value="">(empty)</option>
                              {csvColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                            </Select>
                          ))}
                        </div>
                      ) : null}
                      {summary.bodyVariableCount > 0 ? (
                        <div className="mt-5 grid gap-3 md:grid-cols-1">
                          {csvBodyMap.map((col, i) => (
                            <Select key={i} label={`Body {{${i + 1}}}`} value={col} onChange={(e) => setCsvBodyMap((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))} disabled={!csvColumns.length}>
                              <option value="">(empty)</option>
                              {csvColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                            </Select>
                          ))}
                        </div>
                      ) : null}

                      {buttonsNeedingValue.length > 0 ? (
                        <div className="mt-5 grid gap-3 md:grid-cols-1">
                          {buttonsNeedingValue.map((btn, i) => (
                            <Select
                              key={`btn-${btn.index}`}
                              label={`Button ${btn.index + 1} value (${btn.label})`}
                              value={csvButtonMap[i] || ""}
                              onChange={(e) => setCsvButtonMap((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
                              disabled={!csvColumns.length}
                            >
                              <option value="">(use global button values)</option>
                              {csvColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                            </Select>
                          ))}
                        </div>
                      ) : null}

                      {csvFirstRow ? (
                        <div className="mt-6 rounded-[5px] border border-ink-900/10 bg-white p-4">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-800/50">
                            Real-time mapping (row #1)
                          </div>
                          <div className="mt-3 grid gap-1 text-xs text-ink-800/75">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-mono text-ink-900/55">phone</span>
                              <span className="truncate font-semibold text-ink-900">
                                {csvPhoneColumn ? String((csvFirstRow as any)[csvPhoneColumn] ?? "") : "—"}
                              </span>
                            </div>
                            {csvBodyMap.map((col, idx) => (
                              <div key={`b-${idx}`} className="flex items-center justify-between gap-3">
                                <span className="font-mono text-ink-900/55">{`body{{${idx + 1}}}`}</span>
                                <span className="truncate font-semibold text-ink-900">
                                  {col ? String((csvFirstRow as any)[col] ?? "") : "—"}
                                </span>
                              </div>
                            ))}
                            {csvHeaderMap.map((col, idx) => (
                              <div key={`h-${idx}`} className="flex items-center justify-between gap-3">
                                <span className="font-mono text-ink-900/55">{`header{{${idx + 1}}}`}</span>
                                <span className="truncate font-semibold text-ink-900">
                                  {col ? String((csvFirstRow as any)[col] ?? "") : "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </Card>
                  ) : null}
                </div>

                <div className="self-start md:sticky md:top-3">
                  <Card className="p-6">
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-800/50">Preview</div>
                    <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">Message</div>
                    <div className="mt-4">
                      {selectedTemplate ? (
                        <TemplatePreview {...templatePreviewProps} />
                      ) : (
                        <div className="rounded-[5px] border border-ink-900/10 bg-slate-50 px-5 py-4 text-sm text-ink-800/70">
                          Select a template to see a real-time preview.
                        </div>
                      )}
                    </div>
                    <div className="mt-5 grid gap-3">
                      <Input label="Demo WhatsApp number" value={demoTo} onChange={(e) => setDemoTo(e.target.value)} placeholder="919999999999" />
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-[7px] bg-white border border-ink-900/10"
                        disabled={demoBusy || !templateId || (type === "csv" && !csvFirstRow)}
                        onClick={async () => {
                          setDemoBusy(true);
                          try {
                            await demoSend();
                          } catch (e: any) {
                            const msg = e?.response?.data?.message || e?.message || "Demo send failed";
                            toast(msg, "error");
                          } finally {
                            setDemoBusy(false);
                          }
                        }}
                      >
                        {demoBusy ? "Sending..." : "Demo Send"}
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>

              {type === "api" ? (
                <div className="rounded-[5px] border border-ink-900/10 bg-slate-50 p-6">
                  <div className="text-sm font-black text-ink-900">API campaigns</div>
                  <div className="mt-2 text-sm text-ink-800/70">
                    API campaigns store only a name + template mapping. Contacts come from your integration when you call the send endpoint.
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="p-6 border-t border-ink-900/5 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-ink-800/40">Ready to Launch</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="rounded-[5px]">Cancel</Button>
            <Button 
              onClick={createCampaign} 
              disabled={
                busy ||
                !type ||
                !name.trim() ||
                !templateId ||
                (type !== "api" && (!!estimate?.insufficientBalance || estimateLoading))
              }
              className="bg-brand-600 text-white border-brand-600 rounded-[5px] px-8"
            >
              {busy ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
