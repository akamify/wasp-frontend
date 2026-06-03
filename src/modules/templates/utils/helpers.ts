import type { AuthSupportedApp, CtaButton, HeaderType, TemplateCategory } from "@modules/templates/types/templates.types";

export const CATEGORY_OPTIONS: Array<{ value: TemplateCategory; label: string }> = [
  { value: "utility", label: "Utility" },
  { value: "marketing", label: "Marketing" },
  { value: "authentication", label: "Authentication" },
];

export const CTA_TYPE_OPTIONS = [
  { value: "QUICK_REPLY", label: "Quick Reply" },
  { value: "URL", label: "Visit Website" },
  { value: "VOICE_CALL", label: "Call on WhatsApp" },
  { value: "PHONE_NUMBER", label: "Call phone number" },
  { value: "FLOW", label: "Complete Flow" },
  { value: "COPY_CODE", label: "Copy Offer Code" },
] as const;

export const COPY_CODE_BUTTON_TEXT = "Copy offer code";

export const TEMPLATE_NAME_MIN_CHARS = 4;
export const TEMPLATE_NAME_MAX_CHARS = 512;
export const TEMPLATE_NAME_DISPLAY_CHARS = 25;

const ALLOWED_FLOW_ICONS = new Set(["DOCUMENT", "PROMOTION", "REVIEW"]);

export function normalizeFlowIcon(icon: unknown): "DOCUMENT" | "PROMOTION" | "REVIEW" {
  const value = String(icon || "").toUpperCase();
  if (ALLOWED_FLOW_ICONS.has(value)) return value as "DOCUMENT" | "PROMOTION" | "REVIEW";
  return "DOCUMENT";
}

export function truncateTemplateName(name: string, max = TEMPLATE_NAME_DISPLAY_CHARS) {
  const raw = String(name || "");
  if (raw.length <= max) return raw;
  if (max <= 1) return raw.slice(0, 1);
  return `${raw.slice(0, max - 1)}…`;
}

export function ctaOptionsForCategory(category: TemplateCategory) {
  if (category === "authentication") return [];
  if (category === "utility") return CTA_TYPE_OPTIONS.filter((opt) => opt.value !== "COPY_CODE");
  return CTA_TYPE_OPTIONS;
}

export function statusTone(status: string): "neutral" | "good" | "warn" | "bad" {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "approved") return "good";
  if (normalized === "pending" || normalized === "paused") return "warn";
  if (normalized === "rejected" || normalized === "disabled") return "bad";
  return "neutral";
}

export function newCtaButton(): CtaButton {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "QUICK_REPLY",
    text: "",
    url: "",
    urlExample: "",
    urlMode: "static",
    phoneNumber: "",
    ttlMinutes: "43200",
    flowId: "",
    flowIcon: "DOCUMENT",
    flowType: "",
    offerCode: "",
  };
}

export function isValidHttpsSampleUrl(value: string) {
  const v = String(value || "").trim();
  if (!/^https:\/\//i.test(v)) return false;
  try {
    const u = new URL(v);
    const host = String(u.hostname || "").toLowerCase();
    // require at least one dot and a TLD-like suffix
    if (!host.includes(".")) return false;
    if (!/[a-z0-9-]+\.[a-z]{2,}$/i.test(host) && !/[a-z0-9-]+\.[a-z]{2,}\.[a-z]{2,}$/i.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

export function newAuthSupportedApp(): AuthSupportedApp {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    packageName: "",
    signatureHash: "",
  };
}

export function buildTemplateComponents(
  category: TemplateCategory,
  bodyText: string,
  ctaButtons: CtaButton[],
  headerType: HeaderType,
  headerText: string,
  mediaHandle: string,
  headerLocation: { name: string; address: string; latitude: number; longitude: number } | null,
  footerText: string,
  headerVariableValues?: Record<number, string>,
  variableValues?: Record<number, string>,
  authConfig?: {
    otpType: "ZERO_TAP" | "ONE_TAP" | "COPY_CODE";
    addSecurityRecommendation: boolean;
    includeExpirationWarning: boolean;
    expiresInMinutes: number;
    supportedApps?: AuthSupportedApp[];
  } | null
) {
  if (category === "authentication") {
    const otpType = String(authConfig?.otpType || "COPY_CODE").toUpperCase();
    const expires = Number(authConfig?.expiresInMinutes || 10);
    const addSecurityRecommendation = !!authConfig?.addSecurityRecommendation;
    const includeExpirationWarning = authConfig?.includeExpirationWarning !== false;
    const supportedApps = (authConfig?.supportedApps || [])
      .map((app) => ({
        package_name: String(app.packageName || "").trim(),
        signature_hash: String(app.signatureHash || "").trim(),
      }))
      .filter((app) => app.package_name && app.signature_hash);
    const primaryApp = supportedApps[0];
    return [
      { type: "BODY", add_security_recommendation: addSecurityRecommendation },
      ...(includeExpirationWarning
        ? [{ type: "FOOTER", code_expiration_minutes: Number.isFinite(expires) ? expires : 10 }]
        : []),
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "OTP",
            otp_type: otpType,
            text: "Copy code",
            ...(otpType !== "COPY_CODE" ? { autofill_text: "Autofill" } : {}),
            ...(primaryApp ? { package_name: primaryApp.package_name, signature_hash: primaryApp.signature_hash } : {}),
            ...(supportedApps.length > 0 ? { supported_apps: supportedApps } : {}),
            ...(otpType === "ZERO_TAP" ? { zero_tap_terms_accepted: true } : {}),
          },
        ],
      },
    ];
  }
  const headerIndexes = headerType === "TEXT" ? extractVariableIndexes(headerText) : [];
  const bodyIndexes = extractVariableIndexes(bodyText);

  const headerExampleText =
    headerIndexes.length > 0
      ? headerIndexes
          .slice(0, 1)
          .map((idx) => String((headerVariableValues || {})[idx] || "").trim())
          .filter(Boolean)
      : [];

  const bodyExampleRow =
    bodyIndexes.length > 0
      ? bodyIndexes.map((idx) => String((variableValues || {})[idx] || "").trim()).filter(Boolean)
      : [];

  const components: any[] = [
    ...(headerType === "TEXT" && headerText.trim()
      ? [
          {
            type: "HEADER",
            format: "TEXT",
            text: headerText.trim(),
            ...(headerIndexes.length > 0 ? { example: { header_text: headerExampleText.length ? headerExampleText : ["Sample"] } } : {}),
          },
        ]
      : []),
    ...(headerType === "IMAGE" && mediaHandle.trim()
      ? [{ type: "HEADER", format: "IMAGE", example: { header_handle: [mediaHandle.trim()] } }]
      : []),
    ...(headerType === "VIDEO" && mediaHandle.trim()
      ? [{ type: "HEADER", format: "VIDEO", example: { header_handle: [mediaHandle.trim()] } }]
      : []),
    ...(headerType === "DOCUMENT" && mediaHandle.trim()
      ? [{ type: "HEADER", format: "DOCUMENT", example: { header_handle: [mediaHandle.trim()] } }]
      : []),
    ...(headerType === "LOCATION" && headerLocation
      ? [
          {
            type: "HEADER",
            format: "LOCATION",
            example: {
              header_handle: [
                {
                  latitude: headerLocation.latitude,
                  longitude: headerLocation.longitude,
                  name: headerLocation.name,
                  address: headerLocation.address,
                },
              ],
            },
          },
        ]
      : []),
    {
      type: "BODY",
      text: bodyText.trim(),
      ...(bodyIndexes.length > 0 ? { example: { body_text: [bodyExampleRow.length ? bodyExampleRow : ["Sample"]] } } : {}),
    },
  ];
  if (footerText.trim()) components.push({ type: "FOOTER", text: footerText.trim() });
  const buttons = ctaButtons
    .map((button) => {
      const text = button.text.trim();
      if (!text) return null;
      if (button.type === "URL") {
        const url = button.url.trim();
        if (!url) return null;
        const placeholders = extractVariableIndexes(url);
        const dyn = button.urlMode
          ? button.urlMode === "dynamic"
          : placeholders.length > 0;
        const ex = String(button.urlExample || "").trim();
        return {
          type: "URL",
          text,
          url,
          ...(dyn ? { example: [ex] } : {}),
        };
      }
      if (button.type === "PHONE_NUMBER")
        return button.phoneNumber.trim() ? { type: "PHONE_NUMBER", text, phone_number: button.phoneNumber.trim() } : null;
      if (button.type === "VOICE_CALL") return { type: "VOICE_CALL", text };
      if (button.type === "FLOW")
        return button.flowId.trim()
          ? {
              type: "FLOW",
              text,
              flow_id: button.flowId.trim(),
              icon: normalizeFlowIcon(button.flowIcon),
            }
          : null;
      if (button.type === "COPY_CODE") return { type: "COPY_CODE", text: COPY_CODE_BUTTON_TEXT };
      return { type: "QUICK_REPLY", text };
    })
    .filter(Boolean);
  if (buttons.length) components.push({ type: "BUTTONS", buttons });
  return components;
}

export function extractVariableIndexes(text: string) {
  const set = new Set<number>();
  for (const match of String(text || "").matchAll(/\{\{(\d+)\}\}/g)) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > 0) set.add(parsed);
  }
  return Array.from(set).sort((a, b) => a - b);
}


import { formatTemplateHtml, parseComponentsForPreview } from './templatePreviewHelpers';

export { formatTemplateHtml, parseComponentsForPreview };

