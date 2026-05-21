import { Plus, Trash2, ListPlus, Link, Phone, FileText, Sparkles, Star, Workflow } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { API } from "@api/api";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Alert } from "@components/ui/Alert";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { Textarea } from "@components/ui/Textarea";
import { COPY_CODE_BUTTON_TEXT, TEMPLATE_NAME_MAX_CHARS, TEMPLATE_NAME_MIN_CHARS, buildTemplateComponents, ctaOptionsForCategory, extractVariableIndexes, isValidHttpsSampleUrl, newAuthSupportedApp, newCtaButton, normalizeFlowIcon, parseComponentsForPreview } from "@modules/templates/utils/helpers";
import { TemplatePreview } from "@modules/templates/components/TemplatePreview";
import { AuthenticationTemplateSection } from "@modules/templates/components/sections/AuthenticationTemplateSection";
import { TemplateBodySection } from "@modules/templates/components/sections/TemplateBodySection";
import { TemplateBasicsSection } from "@modules/templates/components/sections/TemplateBasicsSection";
import { TemplateFormHeader } from "@modules/templates/components/sections/TemplateFormHeader";
import { TemplateHeaderSection } from "@modules/templates/components/sections/TemplateHeaderSection";
import type { AuthSupportedApp, CtaButton, HeaderType, TemplateCategory } from "@modules/templates/types/templates.types";

const TEMPLATE_DRAFT_KEY = "template_form_draft_v1";

type Props = {
  open: boolean;
  creating: boolean;
  languageOptions: string[];
  mode?: "create" | "edit";
  initialTemplate?: { name: string; language: string; category: TemplateCategory; components: any[] } | null;
  onClose: () => void;
  onCreate: (payload: { name: string; language: string; category: TemplateCategory; components: any[] }) => Promise<void>;
};

export function TemplateForm({ open, creating, languageOptions, mode = "create", initialTemplate = null, onClose, onCreate }: Props) {
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
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const headerTextRef = useRef<HTMLInputElement | null>(null);
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
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const clearDraft = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TEMPLATE_DRAFT_KEY);
  };

  const variableIndexes = useMemo(() => extractVariableIndexes(bodyText), [bodyText]);
  const nextVariableIndex = useMemo(() => (variableIndexes.length ? Math.max(...variableIndexes) + 1 : 1), [variableIndexes]);
  const headerVariableIndexes = useMemo(() => extractVariableIndexes(headerText), [headerText]);
  const nextHeaderVariableIndex = useMemo(() => (headerVariableIndexes.length ? Math.max(...headerVariableIndexes) + 1 : 1), [headerVariableIndexes]);
  const ctaLimit = 10;
  const canAddCta = category !== "authentication" && ctaButtons.length < ctaLimit;
  const ctaOptions = useMemo(() => ctaOptionsForCategory(category), [category]);
  const authRequiresAppSetup = category === "authentication" && authOtpType !== "COPY_CODE";
  const authAppsValid = useMemo(() => {
    if (!authRequiresAppSetup) return true;
    if (authSupportedApps.length < 1 || authSupportedApps.length > 5) return false;
    return authSupportedApps.every((app) => app.packageName.trim() && app.signatureHash.trim().length === 11);
  }, [authRequiresAppSetup, authSupportedApps]);
  const voiceCallDayOptions = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const days = i + 1;
        return { label: `${days} day${days === 1 ? "" : "s"}`, minutes: days * 24 * 60 };
      }),
    []
  );

  const canCreate = useMemo(() => {
    if (!name.trim()) return false;
    if (mode !== "edit") {
      const len = name.trim().length;
      if (len < TEMPLATE_NAME_MIN_CHARS || len > TEMPLATE_NAME_MAX_CHARS) return false;
    }
    if (category !== "authentication" && !bodyText.trim()) return false;
    if (category !== "authentication" && headerType === "TEXT" && !headerText.trim()) return false;
    if (category !== "authentication" && (headerType === "IMAGE" || headerType === "VIDEO" || headerType === "DOCUMENT") && !mediaHandle.trim()) return false;
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

    // Meta policy: template variables must have sample values (examples) to avoid rejection.
    // Header supports at most 1 variable sample here (as per our UX constraint).
    if (category !== "authentication" && headerType === "TEXT") {
      if (headerVariableIndexes.length > 1) return false;
      if (headerVariableIndexes.length === 1) {
        const idx = headerVariableIndexes[0];
        if (!String(headerVariableValues[idx] || "").trim()) return false;
      }
    }

    if (category !== "authentication") {
      for (const idx of variableIndexes) {
        if (!String(variableValues[idx] || "").trim()) return false;
      }
    }

    return !ctaButtons.some((button) => {
      if (!button.text.trim()) return true;
      if (button.type === "URL") {
        if (!button.url.trim()) return true;
        const urlMode = button.urlMode ?? (extractVariableIndexes(button.url).length > 0 ? "dynamic" : "static");
        const placeholderCount = extractVariableIndexes(button.url).length;
        const urlOk = isValidHttpsSampleUrl(button.url);
        if (!urlOk) return true;
        if (urlMode === "static") {
          // Static URL cannot contain placeholders.
          return placeholderCount > 0;
        }
        // Dynamic URL must contain placeholders and must include a valid sample URL.
        if (placeholderCount < 1) return true;
        const ex = String(button.urlExample || "").trim();
        return !ex || !isValidHttpsSampleUrl(ex);
      }
      if (button.type === "PHONE_NUMBER") return !button.phoneNumber.trim();
      if (button.type === "FLOW") return !button.flowId.trim();
      if (button.type === "VOICE_CALL") {
        const ttl = Number(button.ttlMinutes);
        return !Number.isFinite(ttl) || ttl < 1440 || ttl > 43200;
      }
      return false;
    });
  }, [
    name,
    category,
    bodyText,
    headerType,
    headerText,
    mediaHandle,
    locationLatitude,
    locationLongitude,
    ctaButtons,
    authAddExpiration,
    authExpiresMinutes,
    authAppsValid,
    variableIndexes,
    variableValues,
    headerVariableIndexes,
    headerVariableValues,
  ]);

  const buttonTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    ctaButtons.forEach((button) => {
      counts.set(button.type, (counts.get(button.type) || 0) + 1);
    });
    return counts;
  }, [ctaButtons]);

  const buttonTypeLimit = useMemo(() => {
    return {
      QUICK_REPLY: 10,
      URL: 2,
      PHONE_NUMBER: 1,
      VOICE_CALL: 1,
      FLOW: 1,
      COPY_CODE: 1,
    } as Record<string, number>;
  }, []);

  const wouldExceedLimit = (nextType: string, removingId?: string) => {
    const nextCounts = new Map(buttonTypeCounts);
    if (removingId) {
      const removing = ctaButtons.find((b) => b.id === removingId);
      if (removing) nextCounts.set(removing.type, Math.max(0, (nextCounts.get(removing.type) || 0) - 1));
    }
    nextCounts.set(nextType, (nextCounts.get(nextType) || 0) + 1);
    return (nextCounts.get(nextType) || 0) > (buttonTypeLimit[nextType] ?? 1);
  };

  const needsFlows = useMemo(() => ctaButtons.some((button) => button.type === "FLOW"), [ctaButtons]);

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

  // Load flows only when needed and form is open.
  useEffect(() => {
    if (!open) return;
    if (!needsFlows) return;
    void refreshFlows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, needsFlows]);

  const insertAtSelection = (value: string) => {
    const textarea = bodyRef.current;
    if (!textarea) return setBodyText((prev) => `${prev}${value}`);
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const next = `${bodyText.slice(0, start)}${value}${bodyText.slice(end)}`;
    setBodyText(next);
    requestAnimationFrame(() => textarea.setSelectionRange(start + value.length, start + value.length));
  };

  const wrapSelection = (prefix: string, suffix = prefix) => {
    const textarea = bodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = bodyText.slice(start, end);
    if (!selected) return;
    setBodyText(`${bodyText.slice(0, start)}${prefix}${selected}${suffix}${bodyText.slice(end)}`);
  };

  const runNativeUndoRedo = (command: "undo" | "redo") => {
    const textarea = bodyRef.current;
    if (!textarea) return;
    textarea.focus();
    document.execCommand(command);
    setTimeout(() => setBodyText(textarea.value), 0);
  };

  const reset = () => {
    setName(""); setLanguage("en_US"); setCategory("utility"); setBodyText(""); setHeaderType("NONE");
    setHeaderText(""); setMediaHandle(""); setMediaPreviewUrl(null); setMediaMeta(null); setMediaUploadPct(0); setMediaUploading(false); setMediaUploadError(null);
    setHeaderVariableValues({});
    setLocationName(""); setLocationAddress(""); setLocationLatitude(""); setLocationLongitude("");
    setFooterText(""); setCtaButtons([]); setVariableValues({});
    setFlows([]); setFlowsLoading(false); setFlowsError(null);
    setAuthOtpType("COPY_CODE"); setAuthAddSecurity(true); setAuthAddExpiration(true); setAuthExpiresMinutes("10");
    setAuthSupportedApps([newAuthSupportedApp()]);
    clearDraft();
  };

  useEffect(() => {
    if (!open) return;
    if (mode !== "create") return;
    if (initialTemplate) return;

    try {
      const raw = window.localStorage.getItem(TEMPLATE_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      setName(String(draft?.name || ""));
      setLanguage(String(draft?.language || "en_US"));
      setCategory((draft?.category as TemplateCategory) || "utility");
      setBodyText(String(draft?.bodyText || ""));
      setHeaderType((draft?.headerType as HeaderType) || "NONE");
      setHeaderText(String(draft?.headerText || ""));
      setMediaHandle(String(draft?.mediaHandle || ""));
      setMediaPreviewUrl(typeof draft?.mediaPreviewUrl === "string" ? draft.mediaPreviewUrl : null);
      setMediaMeta(draft?.mediaMeta && typeof draft.mediaMeta === "object" ? draft.mediaMeta : null);
      setHeaderVariableValues(draft?.headerVariableValues || {});
      setLocationName(String(draft?.locationName || ""));
      setLocationAddress(String(draft?.locationAddress || ""));
      setLocationLatitude(String(draft?.locationLatitude || ""));
      setLocationLongitude(String(draft?.locationLongitude || ""));
      setFooterText(String(draft?.footerText || ""));
      setCtaButtons(Array.isArray(draft?.ctaButtons) ? draft.ctaButtons : []);
      setVariableValues(draft?.variableValues || {});
      setAuthOtpType(draft?.authOtpType || "COPY_CODE");
      setAuthAddSecurity(draft?.authAddSecurity !== false);
      setAuthAddExpiration(draft?.authAddExpiration !== false);
      setAuthExpiresMinutes(String(draft?.authExpiresMinutes || "10"));
      setAuthSupportedApps(Array.isArray(draft?.authSupportedApps) && draft.authSupportedApps.length ? draft.authSupportedApps : [newAuthSupportedApp()]);
    } catch {}
  }, [open, mode, initialTemplate]);

  useEffect(() => {
    if (mode !== "create") return;
    const draft = {
      name,
      language,
      category,
      bodyText,
      headerType,
      headerText,
      mediaHandle,
      // Only persist stable data URLs; blob: URLs are session-scoped.
      mediaPreviewUrl: typeof mediaPreviewUrl === "string" && mediaPreviewUrl.startsWith("data:") ? mediaPreviewUrl : null,
      mediaMeta,
      headerVariableValues,
      locationName,
      locationAddress,
      locationLatitude,
      locationLongitude,
      footerText,
      ctaButtons,
      variableValues,
      authOtpType,
      authAddSecurity,
      authAddExpiration,
      authExpiresMinutes,
      authSupportedApps,
    };
    try {
      window.localStorage.setItem(TEMPLATE_DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [
    mode,
    name,
    language,
    category,
    bodyText,
    headerType,
    headerText,
    mediaHandle,
    headerVariableValues,
    locationName,
    locationAddress,
    locationLatitude,
    locationLongitude,
    footerText,
    ctaButtons,
    variableValues,
    authOtpType,
    authAddSecurity,
    authAddExpiration,
    authExpiresMinutes,
    authSupportedApps,
  ]);

  useEffect(() => {
    if (!open) return;
    if (!initialTemplate) return;

    setName(String(initialTemplate.name || ""));
    setLanguage(String(initialTemplate.language || "en_US"));
    setCategory(initialTemplate.category || "utility");

    const parsed = parseComponentsForPreview(initialTemplate.components || []);

    setHeaderType(parsed.headerType);
    setHeaderText(parsed.headerText || "");
    setMediaHandle(parsed.mediaHandle || "");
    setMediaMeta(null);
    setMediaUploadPct(parsed.mediaHandle ? 100 : 0);
    setLocationName(parsed.headerLocation?.name || "");
    setLocationAddress(parsed.headerLocation?.address || "");
    setLocationLatitude(parsed.headerLocation ? String(parsed.headerLocation.latitude) : "");
    setLocationLongitude(parsed.headerLocation ? String(parsed.headerLocation.longitude) : "");
    setBodyText(parsed.bodyText || "");
    setFooterText(parsed.footerText || "");
    setCtaButtons(
      (parsed.ctaButtons || []).map((b) => ({
        ...b,
        ttlMinutes: (b as any).ttlMinutes || "43200",
        flowIcon: normalizeFlowIcon((b as any).flowIcon),
        flowType: "",
        offerCode: (b as any).offerCode || "",
      }))
    );
    if (initialTemplate.category === "authentication" && parsed.authConfig) {
      setAuthOtpType(parsed.authConfig.otpType);
      setAuthAddSecurity(!!parsed.authConfig.addSecurityRecommendation);
      setAuthAddExpiration(parsed.authConfig.includeExpirationWarning !== false);
      setAuthExpiresMinutes(String(parsed.authConfig.expiresInMinutes || 10));
      setAuthSupportedApps(parsed.authConfig.supportedApps?.length ? parsed.authConfig.supportedApps : [newAuthSupportedApp()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTemplate]);

  const clearHeaderMedia = () => {
    setMediaHandle("");
    setMediaUploadPct(0);
    setMediaUploading(false);
    setMediaUploadError(null);
    setMediaMeta(null);
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaPreviewUrl(null);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

  const uploadHeaderMedia = async (file: File) => {
    if (!file) return;
    setMediaUploadError(null);
    setMediaUploadPct(0);
    setMediaMeta(null);

    // Local preview while uploading. If backend returns a stable data URL for small images,
    // we prefer that (so refresh keeps the preview).
    if (mediaPreviewUrl && mediaPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaPreviewUrl(URL.createObjectURL(file));

    setMediaUploading(true);
    try {
      const res = await API.templates.uploadMedia(file, (pct) => setMediaUploadPct(pct));
      setMediaHandle(String(res?.handle || ""));
      if (res?.file && typeof res.file === "object") {
        setMediaMeta({
          originalName: String(res.file.originalName || ""),
          mimeType: String(res.file.mimeType || ""),
          size: Number(res.file.size || 0),
        });
      }
      if (typeof res?.previewDataUrl === "string" && res.previewDataUrl.startsWith("data:")) {
        if (mediaPreviewUrl && mediaPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(mediaPreviewUrl);
        setMediaPreviewUrl(res.previewDataUrl);
      }
      setMediaUploadPct(100);
    } catch (e: any) {
      setMediaHandle("");
      setMediaUploadPct(0);
      setMediaUploadError(e?.response?.data?.details?.providerError || e?.response?.data?.message || "Upload failed");
    } finally {
      setMediaUploading(false);
    }
  };

  const createTemplate = async (event: FormEvent) => {
    event.preventDefault();
    if (!canCreate) return;
    await onCreate({
      name: name.trim(),
      language: language.trim(),
      category,
      components: buildTemplateComponents(
        category,
        bodyText,
        ctaButtons,
        headerType,
        headerText,
        mediaHandle,
        headerType === "LOCATION"
          ? {
              name: locationName.trim(),
              address: locationAddress.trim(),
              latitude: Number(locationLatitude),
              longitude: Number(locationLongitude),
            }
          : null,
        footerText,
        headerVariableValues,
        variableValues,
        category === "authentication"
          ? {
              otpType: authOtpType,
              addSecurityRecommendation: authAddSecurity,
              includeExpirationWarning: authAddExpiration,
              expiresInMinutes: Number(authExpiresMinutes) || 10,
              supportedApps: authSupportedApps,
            }
          : null
      ),
    });
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <Card className="p-6 md:p-10 bg-white shadow-2xl border-none">
      <TemplateFormHeader mode={mode} onClose={onClose} />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <form className="grid gap-5" onSubmit={createTemplate}>
          <TemplateBasicsSection
            category={category}
            language={language}
            languageOptions={languageOptions}
            mode={mode}
            name={name}
            onCategoryChange={setCategory}
            onLanguageChange={setLanguage}
            onNameChange={setName}
          />

          {category === "authentication" ? (
            <AuthenticationTemplateSection
              authAddExpiration={authAddExpiration}
              authAddSecurity={authAddSecurity}
              authAppsValid={authAppsValid}
              authExpiresMinutes={authExpiresMinutes}
              authOtpType={authOtpType}
              authRequiresAppSetup={authRequiresAppSetup}
              authSupportedApps={authSupportedApps}
              setAuthAddExpiration={setAuthAddExpiration}
              setAuthAddSecurity={setAuthAddSecurity}
              setAuthExpiresMinutes={setAuthExpiresMinutes}
              setAuthOtpType={setAuthOtpType}
              setAuthSupportedApps={setAuthSupportedApps}
            />
          ) : (
            <TemplateHeaderSection
              clearHeaderMedia={clearHeaderMedia}
              headerText={headerText}
              headerTextRef={headerTextRef}
              headerType={headerType}
              headerVariableIndexes={headerVariableIndexes}
              headerVariableValues={headerVariableValues}
              locationAddress={locationAddress}
              locationLatitude={locationLatitude}
              locationLongitude={locationLongitude}
              locationName={locationName}
              mediaHandle={mediaHandle}
              mediaInputRef={mediaInputRef}
              mediaUploadError={mediaUploadError}
              mediaUploadPct={mediaUploadPct}
              mediaUploading={mediaUploading}
              nextHeaderVariableIndex={nextHeaderVariableIndex}
              setHeaderText={setHeaderText}
              setHeaderType={setHeaderType}
              setHeaderVariableValues={setHeaderVariableValues}
              setLocationAddress={setLocationAddress}
              setLocationLatitude={setLocationLatitude}
              setLocationLongitude={setLocationLongitude}
              setLocationName={setLocationName}
              uploadHeaderMedia={uploadHeaderMedia}
            />
          )}

          {category !== "authentication" ? (
            <TemplateBodySection
              bodyRef={bodyRef}
              bodyText={bodyText}
              insertAtSelection={insertAtSelection}
              nextVariableIndex={nextVariableIndex}
              runNativeUndoRedo={runNativeUndoRedo}
              setBodyText={setBodyText}
              setVariableValues={setVariableValues}
              variableIndexes={variableIndexes}
              variableValues={variableValues}
              wrapSelection={wrapSelection}
            />
          ) : null}

          {category !== "authentication" ? (
            <Input 
              label="Footer (Optional)" 
              value={footerText} 
              onChange={(e) => setFooterText(e.target.value)} 
              placeholder="Add a short line to the bottom of your message." 
              className="rounded-[5px] shadow-none"
            />
          ) : null}

          {category !== "authentication" ? (
            <div className="rounded-[5px] border border-ink-900/10 bg-slate-50/50 p-5 shadow-none">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-ink-900">
                  <ListPlus size={16} className="text-ink-800/60" /> Buttons (Optional) ({ctaButtons.length}/{ctaLimit})
                </div>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost" 
                  className="flex items-center gap-1.5 rounded-[5px] shadow-none bg-white border border-ink-900/10" 
                  onClick={() => {
                    if (!canAddCta) return;
                    setCtaError(null);
                    setCtaButtons((prev) => [...prev, newCtaButton()]);
                  }} 
                  disabled={!canAddCta}
                >
                  <Plus size={14} /> Add
                </Button>
              </div>
              {ctaError ? (
                <div className="mb-4">
                  <Alert tone="error">{ctaError}</Alert>
                </div>
              ) : null}
              <div className="grid gap-4">
                {ctaButtons.map((button, index) => (
                  <div key={button.id} className="rounded-[5px] border border-ink-900/10 bg-white p-4 shadow-none">
                    <div className="mb-3 flex items-center justify-between border-b border-ink-900/10 pb-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-800/50">Button {index + 1}</span>
                      <Button type="button" size="sm" variant="ghost" className="rounded-[5px] text-red-500 shadow-none hover:bg-red-50 hover:text-red-600" onClick={() => setCtaButtons((prev) => prev.filter((item) => item.id !== button.id))}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 mb-4">
                      <Select 
                        label="Type" 
                        value={button.type} 
                        className="rounded-[5px] shadow-none"
                        onChange={(e) => {
                          const nextType = e.target.value as any;
                          setCtaError(null);
                          if (wouldExceedLimit(nextType, button.id)) {
                            setCtaError(
                              nextType === "URL"
                                ? "Visit Website button max 2 allowed."
                                : nextType === "QUICK_REPLY"
                                  ? "Quick Reply buttons max 10 allowed."
                                  : `Only 1 ${nextType} button allowed.`
                            );
                            return;
                          }
                          setCtaButtons((prev) =>
                            prev.map((item) =>
                              item.id === button.id
                                  ? {
                                      ...item,
                                      type: nextType,
                                      text: nextType === "COPY_CODE" ? COPY_CODE_BUTTON_TEXT : "",
                                      url: "",
                                      urlExample: "",
                                      urlMode: "static",
                                      phoneNumber: "",
                                      flowId: "",
                                      ttlMinutes: "43200",
                                      flowIcon: "DOCUMENT",
                                      flowType: "",
                                    offerCode: "",
                                  }
                                : item
                            )
                          );
                        }}
                      >
                        {ctaOptions.map((option) => {
                          const current = button.type;
                          const count = buttonTypeCounts.get(option.value) || 0;
                          const limit = buttonTypeLimit[option.value] ?? 1;
                          const disabled = option.value !== current && count >= limit;
                          return (
                            <option key={option.value} value={option.value} disabled={disabled}>
                              {option.label}
                              {disabled ? " (limit reached)" : ""}
                            </option>
                          );
                        })}
                      </Select>
                      <Input 
                        label="Button Text" 
                        value={button.type === "COPY_CODE" ? COPY_CODE_BUTTON_TEXT : button.text} 
                        className="rounded-[5px] shadow-none"
                        onChange={(e) => {
                          if (button.type === "COPY_CODE") return;
                          setCtaButtons((prev) => prev.map((item) => item.id === button.id ? { ...item, text: e.target.value } : item));
                        }} 
                        disabled={button.type === "COPY_CODE"}
                        hint={button.type === "COPY_CODE" ? 'Meta requires fixed text: "Copy offer code".' : undefined}
                        required 
                      />
                    </div>
                    {button.type === "URL" ? (
                      <div className="flex items-center gap-3">
                        <Link size={16} className="text-ink-800/40 shrink-0 mt-6" />
                        <div className="flex-1">
                          {(() => {
                            const urlMode = button.urlMode ?? (extractVariableIndexes(button.url).length > 0 ? "dynamic" : "static");
                            const placeholderCount = extractVariableIndexes(button.url).length;
                            const urlValid = button.url.trim() ? isValidHttpsSampleUrl(button.url) : true;
                            const sampleValid = button.urlExample ? isValidHttpsSampleUrl(button.urlExample) : true;

                            const deriveDynamicUrlPattern = (sample: string) => {
                              const raw = String(sample || "").trim();
                              if (!raw) return "";
                              if (!isValidHttpsSampleUrl(raw)) return "";

                              // We intentionally avoid `new URL(...).toString()` because it percent-encodes `{` and `}`
                              // which makes "{{1}}" show up as "%7B%7B1%7D%7D" in the input.
                              const hashIndex = raw.indexOf("#");
                              const hashPart = hashIndex >= 0 ? raw.slice(hashIndex) : "";
                              const withoutHash = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
                              const queryIndex = withoutHash.indexOf("?");
                              const queryPart = queryIndex >= 0 ? withoutHash.slice(queryIndex) : "";
                              const baseAndPath = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;

                              const firstSlash = baseAndPath.indexOf("/", 8); // after "https://"
                              const base = firstSlash >= 0 ? baseAndPath.slice(0, firstSlash) : baseAndPath;
                              const path = firstSlash >= 0 ? baseAndPath.slice(firstSlash) : "";

                              const parts = path.split("/").filter(Boolean);
                              const nextPath = parts.length === 0 ? "/{{1}}" : `/${[...parts.slice(0, -1), "{{1}}"].join("/")}`;
                              return `${base}${nextPath}${queryPart}${hashPart}`;
                            };

                            return (
                              <>
                                <div className="mb-3 flex items-center justify-between gap-3">
                                  <div className="text-xs font-semibold text-ink-800/80">URL mode</div>
                                  <div className="flex rounded-[5px] bg-slate-100 p-1">
                                    <button
                                      type="button"
                                      className={[
                                        "px-3 py-1.5 text-xs font-semibold rounded-[5px]",
                                        urlMode === "static" ? "bg-white shadow-sm text-ink-900" : "text-ink-800/70 hover:text-ink-900",
                                      ].join(" ")}
                                      onClick={() =>
                                        setCtaButtons((prev) =>
                                          prev.map((item) =>
                                            item.id === button.id
                                              ? {
                                                  ...item,
                                                  urlMode: "static",
                                                  url: (() => {
                                                    const sample = String(item.urlExample || "").trim();
                                                    if (sample && isValidHttpsSampleUrl(sample)) return sample;
                                                    const raw = String(item.url || "");
                                                    return raw.replace(/%7B%7B1%7D%7D/gi, "{{1}}");
                                                  })(),
                                                  urlExample: "",
                                                }
                                              : item
                                          )
                                        )
                                      }
                                    >
                                      Static
                                    </button>
                                    <button
                                      type="button"
                                      className={[
                                        "px-3 py-1.5 text-xs font-semibold rounded-[5px]",
                                        urlMode === "dynamic" ? "bg-white shadow-sm text-ink-900" : "text-ink-800/70 hover:text-ink-900",
                                      ].join(" ")}
                                      onClick={() =>
                                        setCtaButtons((prev) =>
                                          prev.map((item) =>
                                            item.id === button.id ? { ...item, urlMode: "dynamic", url: "", urlExample: "" } : item
                                          )
                                        )
                                      }
                                    >
                                      Dynamic
                                    </button>
                                  </div>
                                </div>

                                {urlMode === "static" ? (
                                  <>
                                    <Input
                                      label="URL"
                                      value={button.url}
                                      className="rounded-[5px] shadow-none"
                                      onChange={(e) =>
                                        setCtaButtons((prev) =>
                                          prev.map((item) =>
                                            item.id === button.id ? { ...item, url: e.target.value } : item
                                          )
                                        )
                                      }
                                      placeholder="https://example.co.in/offer"
                                      hint="Static URL must not contain variables. Use a full https:// URL."
                                      required
                                    />
                                    {!urlValid ? (
                                      <div className="mt-1 text-xs text-rose-700">
                                        Enter a valid https:// URL with a real domain extension.
                                      </div>
                                    ) : null}
                                    {placeholderCount > 0 ? (
                                      <div className="mt-1 text-xs text-rose-700">
                                        Static URL cannot contain template variables. Switch to Dynamic or remove placeholders.
                                      </div>
                                    ) : null}
                                  </>
                                ) : (
                                  <div className="mt-1">
                                    <Input
                                      label="Sample URL (required)"
                                      value={button.urlExample || ""}
                                      className="rounded-[5px] shadow-none"
                                      onChange={(e) => {
                                        const nextSample = e.target.value;
                                        const derived = deriveDynamicUrlPattern(nextSample);
                                        setCtaButtons((prev) =>
                                          prev.map((item) =>
                                            item.id === button.id
                                              ? {
                                                  ...item,
                                                  urlExample: nextSample,
                                                  url: derived || item.url,
                                                }
                                              : item
                                          )
                                        );
                                      }}
                                      placeholder="https://example.co.in/offer/OD-18421"
                                      hint="URL must be a full https:// URL with a valid domain extension (.co, .in, .co.in, etc)."
                                      required
                                    />
                                    {!button.urlExample?.trim() ? (
                                      <div className="mt-1 text-xs text-rose-700">
                                        Dynamic URL requires at least one variable like {"{{1}}"} in the URL.
                                      </div>
                                    ) : !sampleValid ? (
                                      <div className="mt-1 text-xs text-rose-700">
                                        Enter a valid https:// sample URL for Meta review.
                                      </div>
                                    ) : !button.url.trim() ? (
                                      <div className="mt-1 text-xs text-rose-700">
                                        Unable to generate dynamic URL pattern. Please re-check the sample URL format.
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    ) : null}
                    {button.type === "PHONE_NUMBER" ? (
                      <div className="flex items-center gap-3">
                        <Phone size={16} className="text-ink-800/40 shrink-0 mt-6" />
                        <div className="flex-1">
                           <Input label="Phone Number" type="number" value={button.phoneNumber} className="rounded-[5px] shadow-none" onChange={(e) => setCtaButtons((prev) => prev.map((item) => item.id === button.id ? { ...item, phoneNumber: e.target.value } : item))} placeholder="9000000000" required />
                        </div>
                      </div>
                    ) : null}
                    {button.type === "VOICE_CALL" ? (
                      <div className="flex items-center gap-3">
                        <Phone size={16} className="text-ink-800/40 shrink-0 mt-6" />
                        <div className="flex-1">
                          <Select
                            label="Validity"
                            value={button.ttlMinutes}
                            className="rounded-[5px] shadow-none"
                            onChange={(e) =>
                              setCtaButtons((prev) =>
                                prev.map((item) =>
                                  item.id === button.id ? { ...item, ttlMinutes: e.target.value } : item
                                )
                              )
                            }
                          >
                            {voiceCallDayOptions.map((opt) => (
                              <option key={opt.minutes} value={String(opt.minutes)}>
                                {opt.label}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    ) : null}
                    {button.type === "FLOW" ? (
                      <div className="flex items-start gap-3">
                        <Workflow size={16} className="text-ink-800/40 shrink-0 mt-7" />
                        <div className="flex-1">
                          <div className="grid gap-3">
                            <div className="text-xs font-semibold text-ink-800/80">Button icon</div>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {[
                                { value: "DOCUMENT", label: "Document", Icon: FileText },
                                { value: "PROMOTION", label: "Promotion", Icon: Sparkles },
                                { value: "REVIEW", label: "Review", Icon: Star },
                              ].map(({ value, label, Icon }) => {
                                const active = String(button.flowIcon || "DOCUMENT").toUpperCase() === value;
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    className={
                                      "flex cursor-pointer items-center gap-2 rounded-[5px] border px-3 py-2 text-sm font-semibold transition " +
                                      (active
                                        ? "border-brand-400/50 bg-brand-50 text-ink-900"
                                        : "border-ink-900/10 bg-white text-ink-900/70 hover:bg-slate-50")
                                    }
                                    onClick={() =>
                                      setCtaButtons((prev) =>
                                        prev.map((item) =>
                                          item.id === button.id ? { ...item, flowIcon: value as any } : item
                                        )
                                      )
                                    }
                                  >
                                    <Icon size={16} className={active ? "text-brand-600" : "text-ink-900/40"} />
                                    <span className="truncate">{label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <label className="block mt-4">
                            <div className="mb-1 text-xs font-semibold text-ink-800/80">Workflow</div>
                            <div className="max-h-56 overflow-y-auto rounded-[5px] bg-white ring-1 ring-ink-900/12 focus-within:ring-2 focus-within:ring-brand-300">
                              <select
                                className="w-full bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none"
                                value={button.flowId}
                                size={Math.min(8, Math.max(4, (flows?.length || 0) + 1))}
                                onChange={(e) =>
                                  setCtaButtons((prev) =>
                                    prev.map((item) =>
                                      item.id === button.id ? { ...item, flowId: e.target.value } : item
                                    )
                                  )
                                }
                              >
                                <option value="">{flowsLoading ? "Loading workflows..." : "Select workflow"}</option>
                                {flows.map((flow) => (
                                  <option key={flow.id} value={flow.id}>
                                    {flow.name ? `${flow.name}` : flow.id}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {flowsError ? (
                              <div className="mt-2">
                                <Alert tone="error">{flowsError}</Alert>
                              </div>
                            ) : null}
                          </label>

                          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-ink-900/45">
                            <span>Selected icon</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black tracking-[0.18em] text-ink-900/60">
                              {String(button.flowIcon || "DOCUMENT").toUpperCase()}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="rounded-[5px] border border-ink-900/10 bg-white shadow-none"
                              onClick={() => void refreshFlows()}
                              disabled={flowsLoading}
                            >
                              Refresh
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="rounded-[5px] border border-ink-900/10 bg-white shadow-none"
                              onClick={() => window.open("/app/flows", "_blank")}
                            >
                              Manage
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {button.type === "COPY_CODE" ? (
                      <div className="flex items-center gap-3">
                        <Link size={16} className="text-ink-800/40 shrink-0 mt-6" />
                        <div className="flex-1">
                          <Input
                            label="Offer code (used when sending)"
                            value={button.offerCode}
                            className="rounded-[5px] shadow-none"
                            onChange={(e) =>
                              setCtaButtons((prev) =>
                                prev.map((item) =>
                                  item.id === button.id ? { ...item, offerCode: e.target.value } : item
                                )
                              )
                            }
                            placeholder="SAVE10"
                            hint="Template creation only sets the button; the code is provided at send time."
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          
          <div className="mt-2 flex justify-end">
            <Button 
              type="submit" 
              className="rounded-[5px] px-8 py-2.5 shadow-none w-full sm:w-auto" 
              disabled={!canCreate || creating}
            >
              {creating ? "Submitting..." : "Submit Template"}
            </Button>
          </div>
        </form>

        <div className="sticky top-6 self-start">
          <TemplatePreview
            category={category}
            headerType={headerType}
            headerText={headerText}
            mediaHandle={mediaHandle}
            mediaPreviewUrl={mediaPreviewUrl}
            mediaMeta={mediaMeta}
            headerLocation={headerType === "LOCATION" ? { name: locationName, address: locationAddress, latitude: Number(locationLatitude), longitude: Number(locationLongitude) } : null}
            headerVariableValues={headerVariableValues}
            bodyText={bodyText}
            footerText={footerText}
            ctaButtons={ctaButtons}
            variableValues={variableValues}
            authConfig={
              category === "authentication"
                ? {
                    otpType: authOtpType,
                    addSecurityRecommendation: authAddSecurity,
                    includeExpirationWarning: authAddExpiration,
                    expiresInMinutes: authAddExpiration ? Number(authExpiresMinutes) || 10 : undefined,
                  }
                : null
            }
          />
        </div>
      </div>
    </Card>
  );
}