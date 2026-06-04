import { useEffect } from "react";
import { API } from "@api/api";
import { getErrorMessage } from "./actions";

export function useCampaignFormEffects(ctx: any) {
  const { isOpen, setLimitsLoading, setMessagingTierRaw, setRemainingQuotaRaw, setWalletBalance, initialType, initialName, initialSelectedPhones, setType, setName, setContactQuery, setSelectedPhones, setMessageType, setTemplateId, setScheduledAt, setScheduleFrequency, setHeaderVars, setBodyVars, setOtpCode, setButtonValues, setButtonValueByIndex, setButtonTtlMinutes, setFlowTokens, setFlowActionDataJson, setCsvBusy, setCsvFileName, setCsvText, setCsvPhoneColumn, setCsvBodyMap, setCsvHeaderMap, setCsvButtonMap, setDemoTo, setDemoBusy, selectedTemplate, summary, buttonTtlMinutes, buttonsNeedingValue, csvColumns, type, autoMapCsvIfEmpty, buttonValues, setEstimate, buildRecipientsForCurrentState, templateId, setEstimateLoading, toast, headerMediaOverride, csvText, selectedPhones, csvPhoneColumn, csvBodyMap, csvHeaderMap, csvButtonMap, headerVars, bodyVars, resolvedButtonValues, otpCode, flowActionDataJson, flowTokens, setWalletBalance: setWalletFromEstimate } = ctx;

  useEffect(() => {
    if (!isOpen) return;
    setLimitsLoading(true);
    (async () => {
      try {
        const [metaRes, walletRes] = await Promise.all([API.meta.status(), API.wallet.get()]);
        const tier = metaRes?.limits?.messagingLimitTier ? String(metaRes.limits.messagingLimitTier) : null;
        setMessagingTierRaw(tier);
        setRemainingQuotaRaw(null);
        if (walletRes?.wallet) setWalletBalance({ amount: walletRes.wallet.balance || 0, currency: walletRes.wallet.currency || "INR" });
      } catch {
        setMessagingTierRaw(null);
        setRemainingQuotaRaw(null);
      } finally {
        setLimitsLoading(false);
      }
    })();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialType !== undefined) setType(initialType ?? null);
    if (initialName !== undefined) setName(String(initialName || ""));
    if (initialSelectedPhones !== undefined) {
      setSelectedPhones(() => {
        const next: Record<string, true> = {};
        (initialSelectedPhones || []).forEach((p: string) => { const phone = String(p || "").replace(/\D/g, ""); if (phone) next[phone] = true; });
        return next;
      });
    }
    setTemplateId("");
    setScheduledAt("");
    setScheduleFrequency("once");
  }, [isOpen, initialType, initialName, initialSelectedPhones]);

  useEffect(() => {
    if (!isOpen) return;
    const hasSeed = initialType !== undefined || initialName !== undefined || (Array.isArray(initialSelectedPhones) && initialSelectedPhones.length > 0);
    if (!hasSeed) { setType(null); setName(""); setContactQuery(""); setSelectedPhones({}); }
    setMessageType("template"); setTemplateId(""); setScheduledAt(""); setScheduleFrequency("once"); setHeaderVars([]); setBodyVars([]); setOtpCode(""); setButtonValues([]); setButtonValueByIndex({}); setButtonTtlMinutes([]); setFlowTokens([]); setFlowActionDataJson("{}"); setCsvBusy(false); setCsvFileName(""); setCsvText(""); setCsvPhoneColumn(""); setCsvBodyMap([]); setCsvHeaderMap([]); setCsvButtonMap([]); setDemoTo(""); setDemoBusy(false);
  }, [isOpen, initialType, initialName, initialSelectedPhones]);

  useEffect(() => {
    if (!isOpen || !selectedTemplate) return;
    setHeaderVars((prev: string[]) => prev.length === summary.headerVariableCount ? prev : Array.from({ length: summary.headerVariableCount }, (_, i) => prev[i] || ""));
    setBodyVars((prev: string[]) => prev.length === summary.bodyVariableCount ? prev : Array.from({ length: summary.bodyVariableCount }, (_, i) => prev[i] || ""));
    if (summary.voiceCallButtons.length > 0 && buttonTtlMinutes.length === 0) setButtonTtlMinutes(summary.voiceCallButtons.map(() => 43200));
    setCsvBodyMap((prev: string[]) => prev.length === summary.bodyVariableCount ? prev : Array.from({ length: summary.bodyVariableCount }, (_, i) => prev[i] || ""));
    setCsvHeaderMap((prev: string[]) => prev.length === summary.headerVariableCount ? prev : Array.from({ length: summary.headerVariableCount }, (_, i) => prev[i] || ""));
    setCsvButtonMap((prev: string[]) => prev.length === buttonsNeedingValue.length ? prev : Array.from({ length: buttonsNeedingValue.length }, (_, i) => prev[i] || ""));
  }, [isOpen, templateId]);

  useEffect(() => {
    if (!isOpen || !buttonsNeedingValue.length) return;
    setButtonValueByIndex((prev: Record<number, string>) => {
      const next: Record<number, string> = {};
      buttonsNeedingValue.forEach((btn: any) => { next[btn.index] = String(prev[btn.index] ?? buttonValues[btn.index] ?? ""); });
      return next;
    });
  }, [isOpen, buttonsNeedingValue, buttonValues]);

  useEffect(() => {
    if (!isOpen || type !== "csv" || !csvColumns.length) return;
    autoMapCsvIfEmpty(csvColumns);
  }, [isOpen, type, csvColumns.join("|"), summary.bodyVariableCount, summary.headerVariableCount]);

  useEffect(() => {
    if (!isOpen || !type || type === "api" || !templateId) { setEstimate(null); return; }
    const recipients = buildRecipientsForCurrentState();
    if (!recipients.length) { setEstimate(null); return; }
    let alive = true;
    const timer = window.setTimeout(async () => {
      setEstimateLoading(true);
      try {
        const res = await API.campaigns.estimate({ templateId, recipients });
        if (!alive) return;
        const est = res?.estimate || null;
        setEstimate(est);
        if (est?.walletBalance !== undefined) setWalletFromEstimate({ amount: est.walletBalance, currency: est.currency || "INR" });
      } catch (error) {
        if (alive) { setEstimate(null); toast(getErrorMessage(error, "Failed to calculate campaign estimate"), "error"); }
      } finally { if (alive) setEstimateLoading(false); }
    }, 350);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [isOpen, type, templateId, selectedPhones, csvText, csvPhoneColumn, csvBodyMap, csvHeaderMap, csvButtonMap, headerVars, bodyVars, resolvedButtonValues, headerMediaOverride, otpCode, flowActionDataJson, buttonTtlMinutes, flowTokens, summary.headerFormat]);
}
