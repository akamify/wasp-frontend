import { API } from "@api/api";
import type { CampaignDemoPayload, CampaignRecipient } from "@modules/campaigns/types/campaign-form.types";
import { digitsOnly, formatCurrency } from "@modules/campaigns/utils/campaignFormatters";

export function getErrorMessage(error: unknown, fallback: string) {
  const candidate = error as { response?: { data?: { message?: string } }; message?: string };
  return candidate?.response?.data?.message || candidate?.message || fallback;
}

export function createCampaignFormActions(ctx: any) {
  const {
    toast, type, selectedTemplate, summary, headerVars, bodyVars, buttonsNeedingValue, buttonValueByIndex, otpCode, csvPhoneColumn, setCsvPhoneColumn, setCsvBodyMap, setCsvHeaderMap, setSelectedPhones, headerMediaOverride, resolvedButtonValues, flowActionDataJson, csvParsed, csvHeaderMap, csvButtonMap, buttonTtlMinutes, flowTokens, csvBodyMap, setHeaderMediaUploading, setHeaderMediaOverride, setHeaderVars, setBusy, messageType, name, templateId, scheduledAt, scheduleFrequency, onSuccess, onClose, estimate,
    audienceMode, selectedTagList, tagMatchedContacts,
  } = ctx;

  const missingBroadcastInputs = () => {
    if (type !== "broadcast" || !selectedTemplate) return [];
    const missing: string[] = [];
    if (summary.headerVariableCount > 0) {
      const required = summary.headerFormat === "TEXT" ? summary.headerVariableCount : 1;
      for (let i = 0; i < required; i += 1) if (!String(headerVars[i] || "").trim()) missing.push(`Header {{${i + 1}}}`);
    }
    if (summary.bodyVariableCount > 0) {
      for (let i = 0; i < summary.bodyVariableCount; i += 1) if (!String(bodyVars[i] || "").trim()) missing.push(`Body {{${i + 1}}}`);
    }
    if (buttonsNeedingValue.length > 0) {
      for (const btn of buttonsNeedingValue) if (!String(buttonValueByIndex[btn.index] ?? "").trim()) missing.push(`${btn.label} (Button ${btn.index + 1})`);
    }
    if (summary.otpButtons > 0 && !String(otpCode || "").trim()) missing.push("OTP code");
    return missing;
  };

  const autoMapCsvIfEmpty = (columns: string[]) => {
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
    setCsvPhoneColumn((prev: string) => String(prev || "").trim() ? prev : findCol(["phone", "phonenumber", "mobile", "msisdn", "to", "number", "whatsapp", "wa", "waid", "contact"]));
    setCsvBodyMap((prev: string[]) => {
      if (prev.some((x) => String(x || "").trim())) return prev;
      const byIndex = Array.from({ length: summary.bodyVariableCount }, (_, i) => {
        const n = i + 1;
        const direct = findCol([`var${n}`, `variable${n}`, `body${n}`, `param${n}`, `parameter${n}`, `field${n}`, `col${n}`]);
        if (direct) return direct;
        if (n === 1) return findCol(["name", "firstname", "first_name", "fullname"]);
        if (n === 2) return findCol(["orderid", "order_id", "order", "invoice", "amount"]);
        if (n === 3) return findCol(["coupon", "code", "offer", "discount"]);
        if (n === 4) return findCol(["link", "url"]);
        return "";
      });
      const phone = csvPhoneColumn || findCol(["phone", "phonenumber", "mobile", "msisdn", "to"]);
      const remaining = columns.filter((c) => c !== phone);
      return byIndex.every((v) => !String(v || "").trim()) ? Array.from({ length: summary.bodyVariableCount }, (_, i) => remaining[i] || "") : byIndex;
    });
    setCsvHeaderMap((prev: string[]) => {
      if (prev.some((x) => String(x || "").trim())) return prev;
      return Array.from({ length: summary.headerVariableCount }, (_, i) => {
        const n = i + 1;
        return findCol([`header${n}`, `headervar${n}`, `header_variable${n}`, `h${n}`, "media", "mediaurl", "image", "imageurl", "document", "doc", "video"]) || "";
      });
    });
  };

  const buildRecipientsForCurrentState = (): CampaignRecipient[] => {
    if (!type || type === "api" || !templateId) return [];
    if (type === "broadcast") {
      const phones = audienceMode === "tags"
        ? (tagMatchedContacts || []).map((contact: any) => String(contact.phone || "")).filter(Boolean)
        : Object.keys(ctx.selectedPhones || {});
      const effectiveHeaderVariables = summary.headerFormat !== "TEXT" && headerMediaOverride ? [headerMediaOverride, ...headerVars.slice(1)] : headerVars;
      return phones.map((to: string) => ({ to, variables: bodyVars, headerVariables: effectiveHeaderVariables, otpCode: String(otpCode || "").trim() || undefined, buttonValues: resolvedButtonValues, buttonTtlMinutes, flowTokens, flowActionData: (() => { try { const parsed = JSON.parse(flowActionDataJson || "{}"); return Array.isArray(parsed) ? parsed : [parsed]; } catch { return []; } })() }));
    }
    if (!csvParsed.rows.length || !csvPhoneColumn) return [];
    const csvFlowActionData = (() => { try { const parsed = JSON.parse(flowActionDataJson || "{}"); return Array.isArray(parsed) ? parsed : [parsed]; } catch { return []; } })();
    return csvParsed.rows.map((row: any): CampaignRecipient | null => {
      const to = digitsOnly(String(row[csvPhoneColumn] ?? "")); if (!to) return null;
      const rowHeaderVariables = csvHeaderMap.map((col: string) => (col ? String(row[col] ?? "") : ""));
      const effectiveHeaderVariables = summary.headerFormat !== "TEXT" && headerMediaOverride ? [headerMediaOverride, ...rowHeaderVariables.slice(1)] : rowHeaderVariables;
      const rowButtonValues = (() => { const out = [...resolvedButtonValues]; buttonsNeedingValue.forEach((btn: any, mapIndex: number) => { const col = csvButtonMap[mapIndex]; if (col) out[btn.index] = String(row[col] ?? ""); }); return out; })();
      return { to, variables: csvBodyMap.map((col: string) => (col ? String(row[col] ?? "") : "")), headerVariables: effectiveHeaderVariables, otpCode: String(otpCode || "").trim() || undefined, buttonValues: rowButtonValues, buttonTtlMinutes, flowTokens, flowActionData: csvFlowActionData };
    }).filter((recipient: CampaignRecipient | null): recipient is CampaignRecipient => Boolean(recipient));
  };

  const demoSend = async () => {
    const to = digitsOnly(ctx.demoTo);
    if (!to) throw new Error("Enter a demo WhatsApp number");
    if (!templateId) throw new Error("Select a template first");
    const data = type === "csv" ? ctx.csvPreviewData : { variables: bodyVars, headerVariables: headerVars };
    const effectiveHeaderVariables = summary.headerFormat !== "TEXT" && headerMediaOverride ? [headerMediaOverride, ...(data.headerVariables || []).slice(1)] : data.headerVariables;
    const effectiveButtonValues = type === "csv" && ctx.csvFirstRow ? (() => { const out = [...resolvedButtonValues]; buttonsNeedingValue.forEach((btn: any, mapIndex: number) => { const col = csvButtonMap[mapIndex]; if (col) out[btn.index] = String(ctx.csvFirstRow[col] ?? ""); }); return out; })() : resolvedButtonValues;
    const payload: CampaignDemoPayload = { templateId, to, variables: data.variables, headerVariables: effectiveHeaderVariables, otpCode: String(otpCode || "").trim() || undefined, buttonValues: effectiveButtonValues, buttonTtlMinutes, flowTokens };
    try { const parsed = JSON.parse(flowActionDataJson || "{}"); payload.flowActionData = Array.isArray(parsed) ? parsed : [parsed]; } catch { payload.flowActionData = []; }
    await API.messages.send(payload);
    toast("Demo message sent successfully", "success");
  };

  const handleDemoError = (error: unknown) => toast(getErrorMessage(error, "Demo send failed"), "error");

  const uploadHeaderMedia = async (file: File) => {
    setHeaderMediaUploading(true);
    try {
      const res = await API.messages.uploadMedia(file);
      const id = String(res?.mediaId || "").trim();
      if (!id) throw new Error("Media upload failed: no mediaId returned");
      setHeaderMediaOverride(id);
      setHeaderVars((prev: string[]) => { const next = prev.length ? [...prev] : [""]; next[0] = id; return next; });
    } catch (error) { toast(getErrorMessage(error, "Media upload failed"), "error"); } finally { setHeaderMediaUploading(false); }
  };

  const toggleSelectedPhone = (phone: string) => setSelectedPhones((prev: Record<string, true>) => { const next = { ...prev }; if (next[phone]) delete next[phone]; else next[phone] = true; return next; });
  const toggleSelectedTag = (tag: string) => ctx.setSelectedTags((prev: Record<string, true>) => { const next = { ...prev }; if (next[tag]) delete next[tag]; else next[tag] = true; return next; });

  const createCampaign = async () => {
    setBusy(true);
    try {
      if (!type) throw new Error("Select a campaign type");
      if (messageType !== "template") throw new Error("Regular message mode not implemented yet");
      const campaignName = name.trim();
      if (!campaignName) throw new Error("Campaign name is required");
      if (!templateId) throw new Error("Select a template");
      const scheduled = scheduledAt.trim() ? new Date(scheduledAt).toISOString() : undefined;
      const schedule = scheduleFrequency && scheduleFrequency !== "once" ? { frequency: scheduleFrequency } : undefined;
      const audienceRuntime = {
        variables: bodyVars,
        headerVariables: summary.headerFormat !== "TEXT" && headerMediaOverride ? [headerMediaOverride, ...headerVars.slice(1)] : headerVars,
        otpCode: String(otpCode || "").trim() || undefined,
        buttonValues: resolvedButtonValues,
        buttonTtlMinutes,
        flowTokens,
        flowActionData: (() => { try { const parsed = JSON.parse(flowActionDataJson || "{}"); return Array.isArray(parsed) ? parsed : [parsed]; } catch { return []; } })(),
      };
      const audience = audienceMode === "tags" ? { mode: "tags", tags: selectedTagList, tagMatch: "all", runtime: audienceRuntime } : { mode: "manual" };
      if (schedule && !scheduled) throw new Error("Select date and time for recurring campaign");
      if (type === "api" && schedule) throw new Error("Recurring schedule is only available for broadcast and CSV campaigns");
      if (type === "api") { await API.campaigns.create({ name: campaignName, type, templateId, scheduledAt: scheduled }); toast("API campaign created. Your integration will provide contacts at send time.", "success"); onSuccess(); onClose(); return; }
      if (type !== "broadcast" && audienceMode === "tags") throw new Error("Tag audience is only available for broadcast campaigns");
      if (audienceMode === "tags" && !selectedTagList.length) throw new Error("Select at least one tag");
      const recipients = audienceMode === "tags" ? [] : buildRecipientsForCurrentState();
      if (audienceMode !== "tags" && !recipients.length) throw new Error("Select at least one valid recipient");
      if (type === "broadcast") { const missing = missingBroadcastInputs(); if (missing.length) throw new Error(`Broadcast template needs values for: ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? "..." : ""} (Use CSV for per-contact variables)`); }
      if (estimate?.insufficientBalance) throw new Error(`Insufficient balance: need ${formatCurrency(estimate.estimatedCredits, estimate.currency)}, available ${formatCurrency(estimate.walletBalance, estimate.currency)}`);
      await API.campaigns.create({ name: campaignName, type, templateId, scheduledAt: scheduled, schedule, audience, recipients });
      toast("Campaign created successfully", "success"); onSuccess(); onClose();
    } catch (error) { toast(getErrorMessage(error, "Failed to create campaign"), "error"); } finally { setBusy(false); }
  };

  return { missingBroadcastInputs, autoMapCsvIfEmpty, buildRecipientsForCurrentState, demoSend, handleDemoError, uploadHeaderMedia, toggleSelectedPhone, toggleSelectedTag, createCampaign };
}
