import { useEffect, useMemo, useState } from "react";

import { API } from "@api/api";
import type { CampaignContact, CampaignDemoPayload, CampaignEstimate, CampaignRecipient, CampaignType, CampaignWalletBalance } from "@modules/campaigns/types/campaign-form.types";
import { digitsOnly, formatCurrency, parseCsvText } from "@modules/campaigns/utils/campaignFormatters";
import { parseComponentsForPreview } from "@modules/templates/utils/helpers";
import type { TemplateCategory } from "@modules/templates/types/templates.types";
import { useToast } from "@shared/providers/ToastContext";
import { inspectTemplate, type TemplateRecord } from "@shared/utils/templateRuntime";

export type CampaignCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  templates: TemplateRecord[];
  contacts: CampaignContact[];
  initialType?: CampaignType | null;
  initialSelectedPhones?: string[];
  initialName?: string;
  lockRecipients?: boolean;
};

export function useCampaignForm({
  isOpen,
  onClose,
  onSuccess,
  templates,
  contacts,
  initialType,
  initialSelectedPhones,
  initialName,
}: CampaignCreateModalProps) {
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
  const [walletBalance, setWalletBalance] = useState<CampaignWalletBalance | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimate, setEstimate] = useState<CampaignEstimate | null>(null);

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
    const to = digitsOnly(String(csvFirstRow[csvPhoneColumn] ?? ""));
    const variables = csvBodyMap.map((col) => (col ? String(csvFirstRow[col] ?? "") : ""));
    const headerVariables = csvHeaderMap.map((col) => (col ? String(csvFirstRow[col] ?? "") : ""));
    return { to, variables, headerVariables };
  }, [csvFirstRow, csvPhoneColumn, csvBodyMap, csvHeaderMap]);

  const templatePreviewProps = useMemo(() => {
    const t = selectedTemplate;
    const category = (t?.category || "utility") as TemplateCategory;
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
              out[btn.index] = String(csvFirstRow[col] ?? "");
            });
            return out;
          })()
        : resolvedButtonValues;

    const payload: CampaignDemoPayload = {
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

  function getErrorMessage(error: unknown, fallback: string) {
    const candidate = error as { response?: { data?: { message?: string } }; message?: string };
    return candidate?.response?.data?.message || candidate?.message || fallback;
  }

  function handleDemoError(error: unknown) {
    toast(getErrorMessage(error, "Demo send failed"), "error");
  }

  async function uploadHeaderMedia(file: File) {
    setHeaderMediaUploading(true);
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
    } catch (error) {
      toast(getErrorMessage(error, "Media upload failed"), "error");
    } finally {
      setHeaderMediaUploading(false);
    }
  }

  function toggleSelectedPhone(phone: string) {
    setSelectedPhones((prev) => {
      const next = { ...prev };
      if (next[phone]) delete next[phone];
      else next[phone] = true;
      return next;
    });
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
    } catch (error) {
      toast(getErrorMessage(error, "Failed to create campaign"), "error");
    } finally {
      setBusy(false);
    }
  }

  function buildRecipientsForCurrentState(): CampaignRecipient[] {
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
        flowActionData: ((): unknown[] => {
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
    const csvFlowActionData = ((): unknown[] => {
      try {
        const parsed = JSON.parse(flowActionDataJson || "{}");
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [];
      }
    })();
    return csvParsed.rows
      .map((row): CampaignRecipient | null => {
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
      .filter((recipient): recipient is CampaignRecipient => Boolean(recipient));
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
      } catch (error) {
        if (alive) {
          setEstimate(null);
          toast(getErrorMessage(error, "Failed to calculate campaign estimate"), "error");
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

  return {
    busy,
    type,
    setType,
    limitsLoading,
    tierInfo,
    audienceCount,
    estimateLoading,
    estimate,
    walletBalance,
    name,
    setName,
    scheduledAt,
    setScheduledAt,
    templateId,
    setTemplateId,
    approvedTemplates,
    selectedPhones,
    contactQuery,
    setContactQuery,
    filteredContacts,
    toggleSelectedPhone,
    summary,
    headerVars,
    setHeaderVars,
    bodyVars,
    setBodyVars,
    otpCode,
    setOtpCode,
    buttonsNeedingValue,
    buttonValueByIndex,
    setButtonValueByIndex,
    buttonTtlMinutes,
    setButtonTtlMinutes,
    flowTokens,
    setFlowTokens,
    flowActionDataJson,
    setFlowActionDataJson,
    headerMediaUploading,
    uploadHeaderMedia,
    csvBusy,
    setCsvBusy,
    csvFileName,
    setCsvFileName,
    csvText,
    setCsvText,
    csvColumns,
    csvPhoneColumn,
    setCsvPhoneColumn,
    csvHeaderMap,
    setCsvHeaderMap,
    csvBodyMap,
    setCsvBodyMap,
    csvButtonMap,
    setCsvButtonMap,
    csvFirstRow,
    selectedTemplate,
    templatePreviewProps,
    demoTo,
    setDemoTo,
    demoBusy,
    setDemoBusy,
    demoSend,
    handleDemoError,
    createCampaign,
  };
}
