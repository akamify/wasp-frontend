import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { API } from "@api/api";
import {
  TEMPLATE_NAME_MAX_CHARS,
  TEMPLATE_NAME_MIN_CHARS,
  buildTemplateComponents,
  ctaOptionsForCategory,
  extractVariableIndexes,
  isValidHttpsSampleUrl,
  newAuthSupportedApp,
  normalizeFlowIcon,
  parseComponentsForPreview,
} from "@modules/templates/utils/helpers";
import type { AuthSupportedApp, CtaButton, HeaderType, TemplateCategory } from "@modules/templates/types/templates.types";

const TEMPLATE_DRAFT_KEY = "template_form_draft_v1";

function hasSequentialIndexes(indexes: number[]) {
  return indexes.every((idx, i) => idx === i + 1);
}

function placeholderCount(text: string) {
  return extractVariableIndexes(text).length;
}

function hasBadVariablePlacement(text: string) {
  const source = String(text || "");
  if (!placeholderCount(source)) return false;
  const trimmed = source.trim();
  return /^\{\{[1-9]\d*\}\}/.test(trimmed) || /\{\{[1-9]\d*\}\}$/.test(trimmed) || /\{\{[1-9]\d*\}\}\s*\{\{[1-9]\d*\}\}/.test(source);
}

function hasMalformedVariable(text: string) {
  const matches = String(text || "").match(/\{\{[^}]*\}\}/g) || [];
  return matches.some((match) => !/^\{\{[1-9]\d*\}\}$/.test(match));
}

function validateVariableText(text: string, label: string, max: number, options?: { required?: boolean; allowVariables?: boolean }) {
  const value = String(text || "");
  const errors: string[] = [];
  const allowVariables = options?.allowVariables !== false;
  if (options?.required && !value.trim()) errors.push(`${label} is required.`);
  if (value.length > max) errors.push(`${label} must be ${max} characters or less.`);
  if (hasMalformedVariable(value)) errors.push(`${label} variables must use numeric format like {{1}}.`);
  if (!allowVariables && placeholderCount(value) > 0) errors.push(`${label} cannot contain variables.`);
  if (allowVariables && hasBadVariablePlacement(value)) errors.push(`${label} variables cannot be first, last, or adjacent. Add meaningful text around each variable.`);
  return errors;
}

export function useTemplateFormState({
  open,
  mode,
  initialTemplate,
}: {
  open: boolean;
  mode: "create" | "edit";
  initialTemplate: { name: string; language: string; category: TemplateCategory; components: any[] } | null;
}) {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en_US");
  const [category, setCategory] = useState<TemplateCategory>("utility");
  const [bodyText, setBodyText] = useState("");
  const [headerType, setHeaderType] = useState<HeaderType>("NONE");
  const [headerText, setHeaderText] = useState("");
  const [mediaHandle, setMediaHandle] = useState("");
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaMeta, setMediaMeta] = useState<{ originalName?: string; mimeType?: string; size?: number } | null>(null);
  const [mediaUploadPct, setMediaUploadPct] = useState(0);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);
  const [headerVariableValues, setHeaderVariableValues] = useState<Record<number, string>>({});
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationLatitude, setLocationLatitude] = useState("");
  const [locationLongitude, setLocationLongitude] = useState("");
  const [footerText, setFooterText] = useState("");
  const [ctaButtons, setCtaButtons] = useState<CtaButton[]>([]);
  const [ctaError, setCtaError] = useState<string | null>(null);
  const [authOtpType, setAuthOtpType] = useState<"ZERO_TAP" | "ONE_TAP" | "COPY_CODE">("COPY_CODE");
  const [authAddSecurity, setAuthAddSecurity] = useState(true);
  const [authAddExpiration, setAuthAddExpiration] = useState(true);
  const [authExpiresMinutes, setAuthExpiresMinutes] = useState("10");
  const [authSupportedApps, setAuthSupportedApps] = useState<AuthSupportedApp[]>([newAuthSupportedApp()]);
  const [flows, setFlows] = useState<Array<{ id: string; name?: string; status?: string }>>([]);
  const [flowsLoading, setFlowsLoading] = useState(false);
  const [flowsError, setFlowsError] = useState<string | null>(null);
  const [variableValues, setVariableValues] = useState<Record<number, string>>({});
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const headerTextRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const variableIndexes = useMemo(() => extractVariableIndexes(bodyText), [bodyText]);
  const nextVariableIndex = useMemo(() => (variableIndexes.length ? Math.max(...variableIndexes) + 1 : 1), [variableIndexes]);
  const headerVariableIndexes = useMemo(() => extractVariableIndexes(headerText), [headerText]);
  const nextHeaderVariableIndex = useMemo(() => (headerVariableIndexes.length ? Math.max(...headerVariableIndexes) + 1 : 1), [headerVariableIndexes]);
  const bodyVariablesSequential = useMemo(() => hasSequentialIndexes(variableIndexes), [variableIndexes]);
  const headerVariablesSequential = useMemo(() => hasSequentialIndexes(headerVariableIndexes), [headerVariableIndexes]);
  const ctaLimit = 10;
  const canAddCta = category !== "authentication" && ctaButtons.length < ctaLimit;
  const ctaOptions = useMemo(() => ctaOptionsForCategory(category), [category]);
  const authRequiresAppSetup = category === "authentication" && authOtpType !== "COPY_CODE";
  const authAppsValid = useMemo(() => !authRequiresAppSetup || (authSupportedApps.length >= 1 && authSupportedApps.length <= 5 && authSupportedApps.every((app) => app.packageName.trim() && app.signatureHash.trim().length === 11)), [authRequiresAppSetup, authSupportedApps]);
  const voiceCallDayOptions = useMemo(() => Array.from({ length: 30 }, (_, i) => ({ label: `${i + 1} day${i === 0 ? "" : "s"}`, minutes: (i + 1) * 24 * 60 })), []);
  const buttonTypeCounts = useMemo(() => ctaButtons.reduce((m, b) => m.set(b.type, (m.get(b.type) || 0) + 1), new Map<string, number>()), [ctaButtons]);
  const buttonTypeLimit = useMemo(() => ({ QUICK_REPLY: 10, URL: 2, PHONE_NUMBER: 1, VOICE_CALL: 1, FLOW: 1, COPY_CODE: 1 } as Record<string, number>), []);
  const wouldExceedLimit = (nextType: string, removingId?: string) => {
    const nextCounts = new Map(buttonTypeCounts);
    if (removingId) {
      const removing = ctaButtons.find((b) => b.id === removingId);
      if (removing) nextCounts.set(removing.type, Math.max(0, (nextCounts.get(removing.type) || 0) - 1));
    }
    nextCounts.set(nextType, (nextCounts.get(nextType) || 0) + 1);
    return (nextCounts.get(nextType) || 0) > (buttonTypeLimit[nextType] ?? 1);
  };

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const isAuth = category === "authentication";
    if (!isAuth) {
      errors.push(...validateVariableText(bodyText, "Body", 1024, { required: true }));
      if (headerType === "TEXT") {
        errors.push(...validateVariableText(headerText, "Header", 60, { required: true }));
        if (headerVariableIndexes.length > 1) errors.push("Header supports only 1 variable.");
      }
      if (footerText.trim()) errors.push(...validateVariableText(footerText, "Footer", 60, { allowVariables: false }));
      ctaButtons.forEach((button, index) => {
        const label = `Button ${index + 1}`;
        if (button.text.length > 25) errors.push(`${label} text must be 25 characters or less.`);
        if (button.type === "URL") {
          if (button.url.length > 2000) errors.push(`${label} URL must be 2000 characters or less.`);
          if (hasMalformedVariable(button.url)) errors.push(`${label} URL variable must use numeric format like {{1}}.`);
          if (placeholderCount(button.url) > 1) errors.push(`${label} URL supports only 1 variable.`);
        }
      });
    }
    return Array.from(new Set(errors));
  }, [category, bodyText, headerType, headerText, headerVariableIndexes, footerText, ctaButtons]);

  const canCreate = useMemo(() => {
    if (!name.trim()) return false;
    if (validationErrors.length > 0) return false;
    if (mode !== "edit") {
      const len = name.trim().length;
      if (len < TEMPLATE_NAME_MIN_CHARS || len > TEMPLATE_NAME_MAX_CHARS) return false;
    }
    if (category !== "authentication" && (!bodyText.trim() || (headerType === "TEXT" && !headerText.trim()) || (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType) && !mediaHandle.trim()))) return false;
    if (category !== "authentication" && headerType === "LOCATION") {
      const lat = Number(locationLatitude);
      const lng = Number(locationLongitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    }
    if (category === "authentication" && authAddExpiration) {
      const minutes = Number(authExpiresMinutes);
      if (!Number.isFinite(minutes) || minutes < 1 || minutes > 90) return false;
    }
    if (category === "authentication" && !authAppsValid) return false;
    if (category !== "authentication" && headerType === "TEXT") {
      if (headerVariableIndexes.length > 1) return false;
      if (!headerVariablesSequential) return false;
      if (headerVariableIndexes.length === 1 && !String(headerVariableValues[headerVariableIndexes[0]] || "").trim()) return false;
    }
    if (category !== "authentication") {
      if (!bodyVariablesSequential) return false;
      if (variableIndexes.some((idx) => !String(variableValues[idx] || "").trim())) return false;
    }
    return !ctaButtons.some((button) => {
      if (!button.text.trim()) return true;
      if (button.type === "URL") {
        if (!button.url.trim()) return true;
        const placeholderCount = extractVariableIndexes(button.url).length;
        const urlMode = button.urlMode ?? (placeholderCount > 0 ? "dynamic" : "static");
        if (!isValidHttpsSampleUrl(button.url)) return true;
        if (urlMode === "static") return placeholderCount > 0;
        return placeholderCount < 1 || !String(button.urlExample || "").trim() || !isValidHttpsSampleUrl(String(button.urlExample || ""));
      }
      if (button.type === "PHONE_NUMBER") return !button.phoneNumber.trim();
      if (button.type === "FLOW") return !button.flowId.trim();
      if (button.type === "VOICE_CALL") {
        const ttl = Number(button.ttlMinutes);
        return !Number.isFinite(ttl) || ttl < 1440 || ttl > 43200;
      }
      return false;
    });
  }, [name, validationErrors, mode, category, bodyText, headerType, headerText, mediaHandle, locationLatitude, locationLongitude, authAddExpiration, authExpiresMinutes, authAppsValid, headerVariableIndexes, headerVariablesSequential, headerVariableValues, bodyVariablesSequential, variableIndexes, variableValues, ctaButtons]);

  const clearDraft = () => typeof window !== "undefined" && window.localStorage.removeItem(TEMPLATE_DRAFT_KEY);
  const reset = () => {
    setName(""); setLanguage("en_US"); setCategory("utility"); setBodyText(""); setHeaderType("NONE"); setHeaderText(""); setMediaHandle(""); setMediaPreviewUrl(null); setMediaMeta(null); setMediaUploadPct(0); setMediaUploading(false); setMediaUploadError(null); setHeaderVariableValues({}); setLocationName(""); setLocationAddress(""); setLocationLatitude(""); setLocationLongitude(""); setFooterText(""); setCtaButtons([]); setVariableValues({}); setFlows([]); setFlowsLoading(false); setFlowsError(null); setAuthOtpType("COPY_CODE"); setAuthAddSecurity(true); setAuthAddExpiration(true); setAuthExpiresMinutes("10"); setAuthSupportedApps([newAuthSupportedApp()]); clearDraft();
  };

  const refreshFlows = async () => {
    setFlowsError(null);
    setFlowsLoading(true);
    try {
      const res = await API.meta.listFlows({ limit: 200 });
      setFlows(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
    } catch (e: any) {
      setFlows([]);
      setFlowsError(e?.response?.data?.message || e?.message || "Unable to load flows");
    } finally {
      setFlowsLoading(false);
    }
  };

  useEffect(() => {
    if (open && ctaButtons.some((button) => button.type === "FLOW")) void refreshFlows();
  }, [open, ctaButtons]);

  useEffect(() => {
    if (!open || mode !== "create" || initialTemplate) return;
    try {
      const draft = JSON.parse(window.localStorage.getItem(TEMPLATE_DRAFT_KEY) || "null");
      if (!draft) return;
      setName(String(draft?.name || "")); setLanguage(String(draft?.language || "en_US")); setCategory((draft?.category as TemplateCategory) || "utility"); setBodyText(String(draft?.bodyText || "")); setHeaderType((draft?.headerType as HeaderType) || "NONE"); setHeaderText(String(draft?.headerText || "")); setMediaHandle(String(draft?.mediaHandle || "")); setMediaPreviewUrl(typeof draft?.mediaPreviewUrl === "string" ? draft.mediaPreviewUrl : null); setMediaMeta(draft?.mediaMeta && typeof draft.mediaMeta === "object" ? draft.mediaMeta : null); setHeaderVariableValues(draft?.headerVariableValues || {}); setLocationName(String(draft?.locationName || "")); setLocationAddress(String(draft?.locationAddress || "")); setLocationLatitude(String(draft?.locationLatitude || "")); setLocationLongitude(String(draft?.locationLongitude || "")); setFooterText(String(draft?.footerText || "")); setCtaButtons(Array.isArray(draft?.ctaButtons) ? draft.ctaButtons : []); setVariableValues(draft?.variableValues || {}); setAuthOtpType(draft?.authOtpType || "COPY_CODE"); setAuthAddSecurity(draft?.authAddSecurity !== false); setAuthAddExpiration(draft?.authAddExpiration !== false); setAuthExpiresMinutes(String(draft?.authExpiresMinutes || "10")); setAuthSupportedApps(Array.isArray(draft?.authSupportedApps) && draft.authSupportedApps.length ? draft.authSupportedApps : [newAuthSupportedApp()]);
    } catch {}
  }, [open, mode, initialTemplate]);

  useEffect(() => {
    if (mode !== "create") return;
    const draft = { name, language, category, bodyText, headerType, headerText, mediaHandle, mediaPreviewUrl: typeof mediaPreviewUrl === "string" && mediaPreviewUrl.startsWith("data:") ? mediaPreviewUrl : null, mediaMeta, headerVariableValues, locationName, locationAddress, locationLatitude, locationLongitude, footerText, ctaButtons, variableValues, authOtpType, authAddSecurity, authAddExpiration, authExpiresMinutes, authSupportedApps };
    try { window.localStorage.setItem(TEMPLATE_DRAFT_KEY, JSON.stringify(draft)); } catch {}
  }, [mode, name, language, category, bodyText, headerType, headerText, mediaHandle, mediaPreviewUrl, mediaMeta, headerVariableValues, locationName, locationAddress, locationLatitude, locationLongitude, footerText, ctaButtons, variableValues, authOtpType, authAddSecurity, authAddExpiration, authExpiresMinutes, authSupportedApps]);

  useEffect(() => {
    if (!open || !initialTemplate) return;
    setName(String(initialTemplate.name || "")); setLanguage(String(initialTemplate.language || "en_US")); setCategory(initialTemplate.category || "utility");
    const parsed = parseComponentsForPreview(initialTemplate.components || []);
    setHeaderType(parsed.headerType); setHeaderText(parsed.headerText || ""); setMediaHandle(parsed.mediaHandle || ""); setMediaMeta(null); setMediaUploadPct(parsed.mediaHandle ? 100 : 0); setLocationName(parsed.headerLocation?.name || ""); setLocationAddress(parsed.headerLocation?.address || ""); setLocationLatitude(parsed.headerLocation ? String(parsed.headerLocation.latitude) : ""); setLocationLongitude(parsed.headerLocation ? String(parsed.headerLocation.longitude) : ""); setBodyText(parsed.bodyText || ""); setFooterText(parsed.footerText || "");
    setCtaButtons((parsed.ctaButtons || []).map((b) => ({ ...b, ttlMinutes: (b as any).ttlMinutes || "43200", flowIcon: normalizeFlowIcon((b as any).flowIcon), flowType: "", offerCode: (b as any).offerCode || "" })));
    if (initialTemplate.category === "authentication" && parsed.authConfig) {
      setAuthOtpType(parsed.authConfig.otpType); setAuthAddSecurity(!!parsed.authConfig.addSecurityRecommendation); setAuthAddExpiration(parsed.authConfig.includeExpirationWarning !== false); setAuthExpiresMinutes(String(parsed.authConfig.expiresInMinutes || 10)); setAuthSupportedApps(parsed.authConfig.supportedApps?.length ? parsed.authConfig.supportedApps : [newAuthSupportedApp()]);
    }
  }, [open, initialTemplate]);

  const insertAtSelection = (value: string) => {
    const textarea = bodyRef.current;
    if (!textarea) return setBodyText((prev) => `${prev}${value}`);
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    setBodyText(`${bodyText.slice(0, start)}${value}${bodyText.slice(end)}`);
    requestAnimationFrame(() => textarea.setSelectionRange(start + value.length, start + value.length));
  };
  const wrapSelection = (prefix: string, suffix = prefix) => {
    const textarea = bodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = bodyText.slice(start, end);
    if (selected) setBodyText(`${bodyText.slice(0, start)}${prefix}${selected}${suffix}${bodyText.slice(end)}`);
  };
  const runNativeUndoRedo = (command: "undo" | "redo") => {
    const textarea = bodyRef.current;
    if (!textarea) return;
    textarea.focus();
    document.execCommand(command);
    setTimeout(() => setBodyText(textarea.value), 0);
  };

  const clearHeaderMedia = () => {
    setMediaHandle(""); setMediaUploadPct(0); setMediaUploading(false); setMediaUploadError(null); setMediaMeta(null);
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaPreviewUrl(null);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };
  const uploadHeaderMedia = async (file: File) => {
    if (!file) return;
    setMediaUploadError(null); setMediaUploadPct(0); setMediaMeta(null);
    if (mediaPreviewUrl && mediaPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaPreviewUrl(URL.createObjectURL(file)); setMediaUploading(true);
    try {
      const res = await API.templates.uploadMedia(file, (pct) => setMediaUploadPct(pct));
      setMediaHandle(String(res?.handle || ""));
      if (res?.file && typeof res.file === "object") setMediaMeta({ originalName: String(res.file.originalName || ""), mimeType: String(res.file.mimeType || ""), size: Number(res.file.size || 0) });
      if (typeof res?.previewDataUrl === "string" && res.previewDataUrl.startsWith("data:")) {
        if (mediaPreviewUrl && mediaPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(mediaPreviewUrl);
        setMediaPreviewUrl(res.previewDataUrl);
      }
      setMediaUploadPct(100);
    } catch (e: any) {
      setMediaHandle(""); setMediaUploadPct(0); setMediaUploadError(e?.response?.data?.details?.providerError || e?.response?.data?.message || "Upload failed");
    } finally {
      setMediaUploading(false);
    }
  };

  const submitTemplate = async (event: FormEvent, onCreate: (payload: { name: string; language: string; category: TemplateCategory; components: any[] }) => Promise<void>, onClose: () => void) => {
    event.preventDefault();
    if (!canCreate) return;
    await onCreate({ name: name.trim(), language: language.trim(), category, components: buildTemplateComponents(category, bodyText, ctaButtons, headerType, headerText, mediaHandle, headerType === "LOCATION" ? { name: locationName.trim(), address: locationAddress.trim(), latitude: Number(locationLatitude), longitude: Number(locationLongitude) } : null, footerText, headerVariableValues, variableValues, category === "authentication" ? { otpType: authOtpType, addSecurityRecommendation: authAddSecurity, includeExpirationWarning: authAddExpiration, expiresInMinutes: Number(authExpiresMinutes) || 10, supportedApps: authSupportedApps } : null) });
    reset();
    onClose();
  };

  return {
    state: { name, language, category, bodyText, headerType, headerText, mediaHandle, mediaPreviewUrl, mediaMeta, mediaUploadPct, mediaUploading, mediaUploadError, headerVariableValues, locationName, locationAddress, locationLatitude, locationLongitude, footerText, ctaButtons, ctaError, authOtpType, authAddSecurity, authAddExpiration, authExpiresMinutes, authSupportedApps, flows, flowsLoading, flowsError, variableValues },
    refs: { mediaInputRef, headerTextRef, bodyRef },
    derived: { variableIndexes, nextVariableIndex, headerVariableIndexes, nextHeaderVariableIndex, bodyVariablesSequential, headerVariablesSequential, ctaLimit, canAddCta, ctaOptions, authRequiresAppSetup, authAppsValid, voiceCallDayOptions, buttonTypeCounts, buttonTypeLimit, validationErrors, canCreate },
    setters: { setName, setLanguage, setCategory, setBodyText, setHeaderType, setHeaderText, setHeaderVariableValues, setLocationName, setLocationAddress, setLocationLatitude, setLocationLongitude, setFooterText, setCtaButtons, setCtaError, setAuthOtpType, setAuthAddSecurity, setAuthAddExpiration, setAuthExpiresMinutes, setAuthSupportedApps, setVariableValues },
    actions: { wouldExceedLimit, refreshFlows, insertAtSelection, wrapSelection, runNativeUndoRedo, clearHeaderMedia, uploadHeaderMedia, submitTemplate },
  };
}
