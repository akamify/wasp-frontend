import { 
  Bold, 
  CheckCircle2,
  Highlighter, 
  Italic, 
  Plus, 
  Redo2, 
  Strikethrough, 
  Trash2, 
  Undo2, 
  X,
  LayoutTemplate,
  MessageSquare,
  ListPlus,
  Type,
  Image as ImageIcon,
  Video,
  Link,
  Phone,
  FileText,
  Sparkles,
  Star,
  Workflow
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { API } from "../../api/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Alert } from "../../components/ui/Alert";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { CATEGORY_OPTIONS, COPY_CODE_BUTTON_TEXT, TEMPLATE_NAME_MAX_CHARS, TEMPLATE_NAME_MIN_CHARS, buildTemplateComponents, ctaOptionsForCategory, extractVariableIndexes, isValidHttpsSampleUrl, newAuthSupportedApp, newCtaButton, normalizeFlowIcon, parseComponentsForPreview } from "./helpers";
import { TemplatePreview } from "./TemplatePreview";
import type { AuthSupportedApp, CtaButton, HeaderType, TemplateCategory } from "./types";

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
      <div className="mb-10 flex items-center justify-between border-b border-slate-50 pb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center text-brand-600">
            <LayoutTemplate size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-800/55">{mode === "edit" ? "Edit Template" : "Create Template"}</div>
            <div className="mt-1 text-2xl font-black text-ink-900">Template Builder</div>
          </div>
        </div>
        <Button variant="ghost" onClick={onClose} className="flex items-center gap-2 rounded-[5px] shadow-none">
          <X size={16} /> Close
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <form className="grid gap-5" onSubmit={createTemplate}>
          <div className="grid gap-4 bg-white p-1">
            <Input 
              label="Template Name" 
              value={name} 
              onChange={(e) => {
                if (mode === "edit") return;
                const raw = e.target.value;
                const sanitized = raw.toLowerCase().replace(/[^a-z0-9_]/g, "_");
                setName(sanitized);
              }} 
              placeholder="e.g. order_confirmation_v1" 
              className="rounded-[5px] shadow-none"
              minLength={TEMPLATE_NAME_MIN_CHARS}
              maxLength={TEMPLATE_NAME_MAX_CHARS}
              required 
              hint={
                mode === "edit"
                  ? "Template name cannot be edited."
                  : `Only lowercase letters, numbers, and underscore are allowed. ${name.trim().length}/${TEMPLATE_NAME_MAX_CHARS} chars (min ${TEMPLATE_NAME_MIN_CHARS}).`
              }
              disabled={mode === "edit"}
            />
            {mode !== "edit" && name.trim() && name.trim().length < TEMPLATE_NAME_MIN_CHARS ? (
              <div className="text-xs font-semibold text-rose-700">
                Template name must be at least {TEMPLATE_NAME_MIN_CHARS} characters.
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Select Template Language" 
                value={language} 
                onChange={(e) => mode !== "edit" && setLanguage(e.target.value)} 
                className="rounded-[5px] shadow-none"
                disabled={mode === "edit"}
              >
                {languageOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Select>
              <Select 
                label="Category" 
                value={category} 
                onChange={(e) => mode !== "edit" && setCategory(e.target.value as TemplateCategory)}
                className="rounded-[5px] shadow-none"
                disabled={mode === "edit"}
              >
                {CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </div>
            {mode === "edit" ? <div className="text-xs text-ink-800/60">Template language and category cannot be changed in edit mode.</div> : null}
          </div>

          {category === "authentication" ? (
            <div className="grid gap-4">
              <div className="rounded-[5px] border border-ink-900/10 bg-slate-50/50 p-5 shadow-none">
                <div className="mb-1 text-sm font-bold text-ink-900">Code delivery setup</div>
                <div className="text-xs text-ink-800/60">
                  Choose how customers send the code from WhatsApp to your app. Edits to this section do not change the template category.
                </div>
                <div className="mt-4 grid gap-3">
                  {[
                    {
                      id: "ZERO_TAP",
                      title: "Zero-tap autofill",
                      desc: "Recommended. The code is sent automatically where supported. If zero-tap or autofill is not available, WhatsApp falls back to a copy code flow.",
                    },
                    {
                      id: "ONE_TAP",
                      title: "One-tap autofill",
                      desc: "Customers tap the button to send the code to your app. A copy code message is used if autofill is not possible.",
                    },
                    {
                      id: "COPY_CODE",
                      title: "Copy code",
                      desc: "Basic authentication with quick setup. Customers copy and paste the code into your app.",
                    },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-[5px] border px-4 py-3 transition ${
                        authOtpType === opt.id ? "border-brand-300 bg-white" : "border-ink-900/10 bg-white/80 hover:bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="authOtpType"
                        value={opt.id}
                        checked={authOtpType === (opt.id as any)}
                        onChange={(e) => setAuthOtpType(e.target.value as any)}
                        className="mt-1 h-4 w-4"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink-900">{opt.title}</div>
                        <div className="mt-0.5 text-xs text-ink-800/60">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {authOtpType === "ZERO_TAP" ? (
                  <div className="mt-4 rounded-[5px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900/80">
                    By using zero-tap, you confirm your customers expect WhatsApp to automatically fill the code on their behalf.
                  </div>
                ) : null}
              </div>

              {authRequiresAppSetup ? (
                <div className="rounded-[5px] border border-ink-900/10 bg-slate-50/50 p-5 shadow-none">
                  <div className="mb-1 text-sm font-bold text-ink-900">App setup</div>
                  <div className="text-xs text-ink-800/60">You can add up to 5 apps. Package name and app signature hash are required for autofill authentication.</div>
                  <div className="mt-4 grid gap-4">
                    {authSupportedApps.map((app, index) => (
                      <div key={app.id} className="rounded-[5px] border border-ink-900/10 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-800/50">App {index + 1}</div>
                          {authSupportedApps.length > 1 ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="rounded-[5px] text-red-500 shadow-none hover:bg-red-50 hover:text-red-600"
                              onClick={() => setAuthSupportedApps((prev) => prev.filter((item) => item.id !== app.id))}
                            >
                              <Trash2 size={14} />
                            </Button>
                          ) : null}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Input
                            label="Package name"
                            value={app.packageName}
                            onChange={(e) =>
                              setAuthSupportedApps((prev) =>
                                prev.map((item) => item.id === app.id ? { ...item, packageName: e.target.value } : item)
                              )
                            }
                            placeholder="com.example.myapplication"
                            className="rounded-[5px] shadow-none"
                            required
                          />
                          <Input
                            label="App signature hash"
                            value={app.signatureHash}
                            onChange={(e) =>
                              setAuthSupportedApps((prev) =>
                                prev.map((item) => item.id === app.id ? { ...item, signatureHash: e.target.value.trim() } : item)
                              )
                            }
                            placeholder="11 characters"
                            hint="Your signature hash must be 11 characters long."
                            className="rounded-[5px] shadow-none"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-ink-800/60">
                      {authAppsValid ? "App setup looks good." : "Add package name and 11-character signature hash for each app."}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="rounded-[5px] border border-ink-900/10 bg-white shadow-none"
                      onClick={() => setAuthSupportedApps((prev) => [...prev, newAuthSupportedApp()])}
                      disabled={authSupportedApps.length >= 5}
                    >
                      <Plus size={14} /> Add app
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="rounded-[5px] border border-ink-900/10 bg-slate-50/50 p-5 shadow-none">
                <div className="mb-1 text-sm font-bold text-ink-900">Content</div>
                <div className="text-xs text-ink-800/60">Authentication template content cannot be edited. You can only add the options below.</div>

                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[5px] border border-ink-900/10 bg-white px-4 py-3">
                  <input
                    type="checkbox"
                    checked={authAddSecurity}
                    onChange={(e) => setAuthAddSecurity(e.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <div>
                    <div className="text-sm font-semibold text-ink-900">Add security recommendation</div>
                    <div className="mt-0.5 text-xs text-ink-800/60">Adds "For your security, do not share this code."</div>
                  </div>
                </label>

                <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-[5px] border border-ink-900/10 bg-white px-4 py-3">
                  <input
                    type="checkbox"
                    checked={authAddExpiration}
                    onChange={(e) => setAuthAddExpiration(e.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-ink-900">Add expiration time for the code</div>
                    <div className="mt-0.5 text-xs text-ink-800/60">Shows "This code expires in X minutes."</div>
                    {authAddExpiration ? (
                      <div className="mt-3 max-w-[220px]">
                        <Input
                          label="Expiration (minutes)"
                          value={authExpiresMinutes}
                          onChange={(e) => setAuthExpiresMinutes(e.target.value.replace(/[^\d]/g, ""))}
                          placeholder="10"
                          hint="Allowed range: 1-90."
                          className="rounded-[5px] shadow-none"
                        />
                      </div>
                    ) : null}
                  </div>
                </label>

                <div className="mt-4 rounded-[5px] border border-ink-900/10 bg-white px-4 py-3 text-xs text-ink-800/70">
                  Authentication template name, language, and category cannot be edited later.
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[5px] border border-ink-900/10 bg-slate-50/50 p-5 shadow-none">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-ink-900">
                <Type size={16} className="text-ink-800/60" /> Header (Optional)
              </div>
              <Select 
                label="Header Type" 
                value={headerType} 
                onChange={(e) => { setHeaderType(e.target.value as HeaderType); setHeaderText(""); setHeaderVariableValues({}); clearHeaderMedia(); setLocationName(""); setLocationAddress(""); setLocationLatitude(""); setLocationLongitude(""); }}
                className="mb-4 rounded-[5px] shadow-none"
              >
                <option value="NONE">None</option>
                <option value="TEXT">Text</option>
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
                <option value="DOCUMENT">Document</option>
                <option value="LOCATION">Location</option>
              </Select>
              {headerType === "TEXT" ? (
                <div className="grid gap-3">
                  <label className="block">
                    <div className="mb-1 text-xs font-semibold text-ink-800/80">Header Text</div>
                    <input
                      ref={headerTextRef}
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                      placeholder="Limited-time offer {{1}}"
                      className="w-full rounded-[5px] bg-white px-3 py-2.5 text-sm text-ink-900 ring-1 ring-ink-900/12 placeholder:text-ink-900/35 focus:outline-none focus:ring-2 focus:ring-brand-300"
                      required
                    />
                    <div className="mt-1 text-xs text-ink-800/60">Variables are allowed in header text too, like {`{{1}}`}.</div>
                  </label>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {headerVariableIndexes.map((idx) => (
                        <Button
                          key={idx}
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-[5px] shadow-none border border-ink-900/10"
                          onClick={() => {
                            const el = headerTextRef.current;
                            if (!el) return setHeaderText((prev) => `${prev}{{${idx}}}`);
                            const start = el.selectionStart ?? 0;
                            const end = el.selectionEnd ?? 0;
                            const next = `${headerText.slice(0, start)}{{${idx}}}${headerText.slice(end)}`;
                            setHeaderText(next);
                            requestAnimationFrame(() => el.setSelectionRange(start + String(`{{${idx}}}`).length, start + String(`{{${idx}}}`).length));
                          }}
                        >
                          {`{{${idx}}}`}
                        </Button>
                      ))}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="flex items-center gap-1.5 rounded-[5px] shadow-none text-brand-600 bg-brand-50 hover:bg-brand-100"
                      disabled={headerVariableIndexes.length >= 1}
                      onClick={() => {
                        const el = headerTextRef.current;
                        const value = `{{${nextHeaderVariableIndex}}}`;
                        if (!el) return setHeaderText((prev) => `${prev}${value}`);
                        const start = el.selectionStart ?? 0;
                        const end = el.selectionEnd ?? 0;
                        const next = `${headerText.slice(0, start)}${value}${headerText.slice(end)}`;
                        setHeaderText(next);
                        requestAnimationFrame(() => el.setSelectionRange(start + value.length, start + value.length));
                      }}
                    >
                      <Plus size={14} /> Add {`{{${nextHeaderVariableIndex}}}`}
                    </Button>
                  </div>

                  {headerVariableIndexes.length > 1 ? (
                    <div className="rounded-[5px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                      Header text can contain maximum 1 variable. Remove extra placeholders to continue.
                    </div>
                  ) : null}

                  {headerVariableIndexes.length > 0 ? (
                    <div className="rounded-[5px] border border-ink-900/10 bg-white p-4 shadow-none">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-800/60">
                        Header Variable Values (Preview)
                      </div>
                      <div className="grid gap-4 sm:grid-cols-1">
                        {headerVariableIndexes.map((index) => (
                          <Input
                            key={index}
                            label={`Value for {{${index}}}`}
                            value={headerVariableValues[index] || ""}
                            onChange={(event) => setHeaderVariableValues((prev) => ({ ...prev, [index]: event.target.value }))}
                            placeholder={`Enter value for {{${index}}}`}
                            className="rounded-[5px] shadow-none"
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {headerType === "IMAGE" || headerType === "VIDEO" || headerType === "DOCUMENT" ? (
                <div className="grid gap-4">
                  <div className="rounded-[5px] border border-ink-900/10 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-white border border-ink-900/10 text-ink-800/50">
                          {headerType === "IMAGE" ? <ImageIcon size={18} /> : headerType === "VIDEO" ? <Video size={18} /> : <MessageSquare size={18} />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-ink-900">
                            {headerType === "IMAGE" ? "Header Image" : headerType === "VIDEO" ? "Header Video" : "Header Document"}
                          </div>
                          <div className="text-xs text-ink-800/55">Upload file, get Meta handle, and preview instantly.</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          ref={mediaInputRef}
                          type="file"
                          accept={headerType === "IMAGE" ? "image/*" : headerType === "VIDEO" ? "video/*" : ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,application/pdf"}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadHeaderMedia(file);
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-[5px] shadow-none bg-brand-50 text-brand-700 hover:bg-brand-100"
                          onClick={() => mediaInputRef.current?.click()}
                          disabled={mediaUploading}
                        >
                          {mediaHandle && !mediaUploading ? "Replace" : mediaUploading ? "Uploading..." : "Upload"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-[5px] shadow-none border border-ink-900/10"
                          onClick={clearHeaderMedia}
                          disabled={mediaUploading && !mediaHandle}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-[5px] border border-ink-900/10 bg-slate-50 px-3 py-2">
                      <div className="text-xs font-semibold text-ink-900/65">
                        {mediaHandle && !mediaUploading ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700">
                            <CheckCircle2 size={14} /> Uploaded
                          </span>
                        ) : mediaUploading ? (
                          "Uploading…"
                        ) : (
                          "No file uploaded"
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-ink-900/35">
                        {mediaHandle && !mediaUploading ? "Ready" : mediaUploadPct ? `${mediaUploadPct}%` : ""}
                      </div>
                    </div>

                    {mediaUploading || mediaUploadPct > 0 ? (
                      <div className="mt-4">
                        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 transition-[width] duration-200"
                            style={{ width: `${Math.min(100, Math.max(0, mediaUploadPct))}%` }}
                          />
                        </div>
                        {mediaUploading ? (
                          <div className="mt-2 text-[11px] font-medium text-ink-900/40">
                            Please wait… this can take a few seconds for large files.
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {mediaUploadError ? (
                      <div className="mt-3">
                        <Alert tone="error">{mediaUploadError}</Alert>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {headerType === "LOCATION" ? (
                <div className="grid gap-4 rounded-[5px] border border-ink-900/10 bg-white p-4">
                  <Input label="Location Name" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="Office / Store name" className="rounded-[5px] shadow-none" />
                  <Input label="Address" value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} placeholder="Full address" className="rounded-[5px] shadow-none" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Latitude" value={locationLatitude} onChange={(e) => setLocationLatitude(e.target.value)} placeholder="28.6139" className="rounded-[5px] shadow-none" required />
                    <Input label="Longitude" value={locationLongitude} onChange={(e) => setLocationLongitude(e.target.value)} placeholder="77.2090" className="rounded-[5px] shadow-none" required />
                  </div>
                  <div className="text-xs text-ink-800/55">
                    This is used only as template example + preview. Sending location templates will be added in the send flow.
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {category !== "authentication" ? (
            <div className="rounded-[5px] border border-ink-900/10 bg-slate-50/50 p-5 shadow-none">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-ink-900">
                <MessageSquare size={16} className="text-ink-800/60" /> Body
              </div>
              <Textarea 
                label="Body Text" 
                value={bodyText} 
                onChange={(e) => setBodyText(e.target.value)} 
                rows={6} 
                ref={bodyRef} 
                className="rounded-[5px] shadow-none"
                required 
                onKeyDown={(event) => {
                  const key = event.key.toLowerCase();
                  if ((event.ctrlKey || event.metaKey) && key === "z" && !event.shiftKey) { event.preventDefault(); runNativeUndoRedo("undo"); }
                  if ((event.ctrlKey || event.metaKey) && (key === "y" || (key === "z" && event.shiftKey))) { event.preventDefault(); runNativeUndoRedo("redo"); }
                }} 
              />
              <div className="my-3 flex flex-wrap items-center justify-between gap-4 border-b border-ink-900/10 pb-4">
                <div className="flex flex-wrap items-center gap-1">
                  <Button type="button" size="sm" variant="ghost" className="rounded-[5px] shadow-none" onClick={() => runNativeUndoRedo("undo")}><Undo2 size={14} /></Button>
                  <Button type="button" size="sm" variant="ghost" className="rounded-[5px] shadow-none" onClick={() => runNativeUndoRedo("redo")}><Redo2 size={14} /></Button>
                  <div className="h-4 w-px bg-ink-900/20 mx-1"></div>
                  <Button type="button" size="sm" variant="ghost" className="rounded-[5px] shadow-none" onClick={() => wrapSelection("*")}><Bold size={14} /></Button>
                  <Button type="button" size="sm" variant="ghost" className="rounded-[5px] shadow-none" onClick={() => wrapSelection("_")}><Italic size={14} /></Button>
                  <Button type="button" size="sm" variant="ghost" className="rounded-[5px] shadow-none" onClick={() => wrapSelection("~")}><Strikethrough size={14} /></Button>
                  <Button type="button" size="sm" variant="ghost" className="rounded-[5px] shadow-none" onClick={() => wrapSelection("[blue]", "[/blue]")}><Highlighter size={14} /></Button>
                </div>
                <Button type="button" size="sm" variant="ghost" className="flex items-center gap-1.5 rounded-[5px] shadow-none text-brand-600 bg-brand-50 hover:bg-brand-100" onClick={() => insertAtSelection(`{{${nextVariableIndex}}}`)}>
                  <Plus size={14} /> Add {`{{${nextVariableIndex}}}`}
                </Button>
              </div>
              
              {variableIndexes.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {variableIndexes.map((idx) => (
                    <Button key={idx} type="button" size="sm" variant="ghost" className="rounded-[5px] shadow-none border border-ink-900/10" onClick={() => insertAtSelection(`{{${idx}}}`)}>
                      {`{{${idx}}}`}
                    </Button>
                  ))}
                </div>
              )}

              {variableIndexes.length > 0 ? (
                <div className="mt-4 rounded-[5px] border border-ink-900/10 bg-white p-4 shadow-none">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-800/60">Variable Values</div>
                  <div className="grid gap-4 sm:grid-cols-1">
                    {variableIndexes.map((index) => (
                      <Input
                        key={index}
                        label={`Value for {{${index}}}`}
                        value={variableValues[index] || ""}
                        onChange={(event) => setVariableValues((prev) => ({ ...prev, [index]: event.target.value }))}
                        placeholder={`Enter value for {{${index}}}`}
                        className="rounded-[5px] shadow-none"
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
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
