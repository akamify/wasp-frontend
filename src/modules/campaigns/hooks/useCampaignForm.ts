import { useMemo, useState } from "react";

import type { CampaignContact, CampaignEstimate, CampaignScheduleFrequency, CampaignType, CampaignWalletBalance } from "@modules/campaigns/types/campaign-form.types";
import { digitsOnly, parseCsvText } from "@modules/campaigns/utils/campaignFormatters";
import { createCampaignFormActions } from "@modules/campaigns/hooks/use-campaign-form/actions";
import { useCampaignFormEffects } from "@modules/campaigns/hooks/use-campaign-form/effects";
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

export function useCampaignForm(props: CampaignCreateModalProps) {
  const { isOpen, onClose, onSuccess, templates, contacts, initialType, initialSelectedPhones, initialName } = props;
  const { toast } = useToast();

  const [type, setType] = useState<CampaignType | null>(null);
  const [limitsLoading, setLimitsLoading] = useState(false);
  const [messagingTierRaw, setMessagingTierRaw] = useState<string | null>(null);
  const [remainingQuotaRaw, setRemainingQuotaRaw] = useState<number | null>(null);
  const [messageType, setMessageType] = useState<"template" | "regular">("template");
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduleFrequency, setScheduleFrequency] = useState<CampaignScheduleFrequency>("once");
  const [busy, setBusy] = useState(false);
  const [walletBalance, setWalletBalance] = useState<CampaignWalletBalance | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimate, setEstimate] = useState<CampaignEstimate | null>(null);
  const [contactQuery, setContactQuery] = useState("");
  const [selectedPhones, setSelectedPhones] = useState<Record<string, true>>({});

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
  const [headerMediaOverride, setHeaderMediaOverride] = useState("");

  const approvedTemplates = useMemo(() => templates.filter((t) => t.status === "approved"), [templates]);
  const selectedTemplate = useMemo(() => approvedTemplates.find((t) => t._id === templateId), [approvedTemplates, templateId]);
  const summary = useMemo(() => inspectTemplate(selectedTemplate), [selectedTemplate]);

  const tierInfo = useMemo(() => {
    const raw = String(messagingTierRaw || "").trim();
    if (!raw) return null;
    const upper = raw.toUpperCase();
    const tierLabel = upper.includes("TIER_") ? upper.replace(/^.*TIER_/, "Tier ").replace(/_/g, " ") : raw;
    const match = upper.match(/(\d+)\s*(K|M)?/);
    let limit = match ? Number(match[1]) : NaN;
    if (match?.[2] === "K") limit *= 1000;
    if (match?.[2] === "M") limit *= 1000 * 1000;
    if (!Number.isFinite(limit) || limit <= 0) limit = NaN;
    return { tierLabel, limitPer24h: Number.isFinite(limit) ? limit : null, remainingQuota: remainingQuotaRaw ?? (Number.isFinite(limit) ? limit : null) };
  }, [messagingTierRaw, remainingQuotaRaw]);

  const buttonsNeedingValue = useMemo(() => {
    const all = [...summary.dynamicUrlButtons, ...summary.copyCodeButtons];
    const seen = new Set<number>();
    return all.filter((b) => (!seen.has(b.index) && (seen.add(b.index), true)));
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
    return {
      to: digitsOnly(String(csvFirstRow[csvPhoneColumn] ?? "")),
      variables: csvBodyMap.map((col) => (col ? String(csvFirstRow[col] ?? "") : "")),
      headerVariables: csvHeaderMap.map((col) => (col ? String(csvFirstRow[col] ?? "") : "")),
    };
  }, [csvFirstRow, csvPhoneColumn, csvBodyMap, csvHeaderMap]);

  const templatePreviewProps = useMemo(() => {
    const t = selectedTemplate;
    const category = (t?.category || "utility") as TemplateCategory;
    const parsed = parseComponentsForPreview(t?.components);
    const values = type === "csv" ? csvPreviewData.variables : bodyVars;
    const headerValues = type === "csv" ? csvPreviewData.headerVariables : headerVars;
    const variableValues = values.reduce<Record<number, string>>((acc, v, i) => ((acc[i + 1] = String(v ?? "")), acc), {});
    const headerVariableValues = headerValues.reduce<Record<number, string>>((acc, v, i) => ((acc[i + 1] = String(v ?? "")), acc), {});
    const overrideHandle = ["IMAGE", "VIDEO", "DOCUMENT"].includes(parsed.headerType)
      ? String(headerMediaOverride || headerValues[0] || "").trim()
      : "";
    const effectiveMediaHandle = overrideHandle || parsed.mediaHandle;
    return {
      category,
      headerType: parsed.headerType,
      headerText: parsed.headerText,
      mediaHandle: effectiveMediaHandle,
      mediaPreviewUrl: /^https?:\/\//i.test(effectiveMediaHandle) ? effectiveMediaHandle : null,
      bodyText: parsed.bodyText,
      footerText: parsed.footerText,
      ctaButtons: parsed.ctaButtons,
      variableValues,
      headerVariableValues,
      status: t?.status,
      language: t?.language,
      categoryRaw: t?.category,
      source: t,
    };
  }, [selectedTemplate, type, csvPreviewData, bodyVars, headerVars, headerMediaOverride]);

  const actions = createCampaignFormActions({
    toast, type, selectedTemplate, summary, headerVars, bodyVars, buttonsNeedingValue, buttonValueByIndex, otpCode,
    csvPhoneColumn, setCsvPhoneColumn, setCsvBodyMap, setCsvHeaderMap, selectedPhones, setSelectedPhones,
    headerMediaOverride, resolvedButtonValues, flowActionDataJson, csvParsed, csvHeaderMap, csvButtonMap, buttonTtlMinutes,
    flowTokens, csvBodyMap, setHeaderMediaUploading, setHeaderMediaOverride, setHeaderVars, setBusy, messageType,
    name, templateId, scheduledAt, scheduleFrequency, onSuccess, onClose, estimate, demoTo, csvPreviewData, csvFirstRow,
  });

  useCampaignFormEffects({
    isOpen, setLimitsLoading, setMessagingTierRaw, setRemainingQuotaRaw, setWalletBalance, initialType, initialName,
    initialSelectedPhones, setType, setName, setContactQuery, setSelectedPhones, setMessageType, setTemplateId,
    setScheduleFrequency,
    setScheduledAt, setHeaderVars, setBodyVars, setOtpCode, setButtonValues, setButtonValueByIndex, setButtonTtlMinutes,
    setFlowTokens, setFlowActionDataJson, setCsvBusy, setCsvFileName, setCsvText, setCsvPhoneColumn, setCsvBodyMap,
    setCsvHeaderMap, setCsvButtonMap, setDemoTo, setDemoBusy, selectedTemplate, summary, buttonTtlMinutes,
    buttonsNeedingValue, csvColumns, type, autoMapCsvIfEmpty: actions.autoMapCsvIfEmpty, buttonValues, setEstimate,
    buildRecipientsForCurrentState: actions.buildRecipientsForCurrentState, templateId, setEstimateLoading, toast,
    headerMediaOverride, csvText, selectedPhones, csvPhoneColumn, csvBodyMap, csvHeaderMap, csvButtonMap, headerVars,
    bodyVars, resolvedButtonValues, otpCode, flowActionDataJson, flowTokens,
  });

  return {
    busy, type, setType, limitsLoading, tierInfo, audienceCount, estimateLoading, estimate, walletBalance,
    name, setName, scheduledAt, setScheduledAt, scheduleFrequency, setScheduleFrequency, templateId, setTemplateId, approvedTemplates, selectedPhones,
    contactQuery, setContactQuery, filteredContacts, toggleSelectedPhone: actions.toggleSelectedPhone, summary,
    headerVars, setHeaderVars, bodyVars, setBodyVars, otpCode, setOtpCode, buttonsNeedingValue, buttonValueByIndex,
    setButtonValueByIndex, buttonTtlMinutes, setButtonTtlMinutes, flowTokens, setFlowTokens, flowActionDataJson,
    setFlowActionDataJson, headerMediaUploading, uploadHeaderMedia: actions.uploadHeaderMedia, csvBusy, setCsvBusy,
    csvFileName, setCsvFileName, csvText, setCsvText, csvColumns, csvPhoneColumn, setCsvPhoneColumn, csvHeaderMap,
    setCsvHeaderMap, csvBodyMap, setCsvBodyMap, csvButtonMap, setCsvButtonMap, csvFirstRow, selectedTemplate,
    templatePreviewProps, demoTo, setDemoTo, demoBusy, setDemoBusy, demoSend: actions.demoSend,
    handleDemoError: actions.handleDemoError, createCampaign: actions.createCampaign,
  };
}
