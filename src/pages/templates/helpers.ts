import type { AuthSupportedApp, CtaButton, HeaderType, TemplateCategory } from "./types";

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
    phoneNumber: "",
    ttlMinutes: "43200",
    flowId: "",
    flowIcon: "DEFAULT",
    flowType: "",
    offerCode: "",
  };
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
  const components: any[] = [
    ...(headerType === "TEXT" && headerText.trim() ? [{ type: "HEADER", format: "TEXT", text: headerText.trim() }] : []),
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
    { type: "BODY", text: bodyText.trim() },
  ];
  if (footerText.trim()) components.push({ type: "FOOTER", text: footerText.trim() });
  const buttons = ctaButtons
    .map((button) => {
      const text = button.text.trim();
      if (!text) return null;
      if (button.type === "URL") return button.url.trim() ? { type: "URL", text, url: button.url.trim() } : null;
      if (button.type === "PHONE_NUMBER")
        return button.phoneNumber.trim() ? { type: "PHONE_NUMBER", text, phone_number: button.phoneNumber.trim() } : null;
      if (button.type === "VOICE_CALL") return { type: "VOICE_CALL", text };
      if (button.type === "FLOW")
        return button.flowId.trim()
          ? {
              type: "FLOW",
              text,
              flow_id: button.flowId.trim(),
              icon: button.flowIcon || "DEFAULT",
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

function escapeHtml(input: string) {
  return input.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export function formatTemplateHtml(sourceText: string, variableValues: Record<number, string>) {
  let html = escapeHtml(String(sourceText || ""));
  html = html.replace(/\{\{(\d+)\}\}/g, (_, num) => {
    const index = Number(num);
    const value = (variableValues[index] || "").trim();
    return value ? `<span class="font-medium text-[#355fa3]">${escapeHtml(value)}</span>` : `<span class="rounded bg-blue-100 px-1 text-blue-700">{{${num}}}</span>`;
  });
  html = html.replace(/~_\*([\s\S]+?)\*_~/g, '<span class="line-through italic font-semibold">$1</span>');
  html = html.replace(/~\*([\s\S]+?)\*~/g, '<span class="line-through font-semibold">$1</span>');
  html = html.replace(/_\*([\s\S]+?)\*_/g, '<span class="italic font-semibold">$1</span>');
  html = html.replace(/\[blue\]([\s\S]+?)\[\/blue\]/g, '<span class="text-blue-700">$1</span>');
  html = html.replace(/\*([\s\S]+?)\*/g, "<strong>$1</strong>");
  html = html.replace(/_([\s\S]+?)_/g, "<em>$1</em>");
  html = html.replace(/~([\s\S]+?)~/g, '<span class="line-through">$1</span>');
  return html.replace(/\n/g, "<br/>");
}

export function parseComponentsForPreview(components?: any[]) {
  const normalizeHandle = (value: any) => {
    const raw = String(value || "");
    // Meta sometimes returns multiple handles or includes newlines in a single string.
    // We only need the first handle token.
    return raw.split(/\s+/).filter(Boolean)[0] || "";
  };

  const parsed = {
    headerType: "NONE" as HeaderType,
    headerText: "",
    mediaHandle: "",
    headerLocation: null as null | { name: string; address: string; latitude: number; longitude: number },
    bodyText: "",
    footerText: "",
    ctaButtons: [] as CtaButton[],
    authConfig: null as null | {
      otpType: "ZERO_TAP" | "ONE_TAP" | "COPY_CODE";
      addSecurityRecommendation: boolean;
      includeExpirationWarning: boolean;
      expiresInMinutes: number;
      supportedApps: AuthSupportedApp[];
    },
  };
  for (const comp of Array.isArray(components) ? components : []) {
    if (comp?.type === "HEADER") {
      const format = String(comp?.format || "TEXT").toUpperCase();
      if (format === "TEXT") {
        parsed.headerType = "TEXT";
        parsed.headerText = String(comp?.text || "");
      } else if (format === "IMAGE" || format === "VIDEO" || format === "DOCUMENT") {
        parsed.headerType = format as HeaderType;
        parsed.mediaHandle = normalizeHandle(comp?.example?.header_handle?.[0]);
      } else if (format === "LOCATION") {
        parsed.headerType = "LOCATION";
        const loc = comp?.example?.header_handle?.[0];
        if (loc && typeof loc === "object") {
          parsed.headerLocation = {
            name: String(loc?.name || ""),
            address: String(loc?.address || ""),
            latitude: Number(loc?.latitude || 0),
            longitude: Number(loc?.longitude || 0),
          };
        }
      }
    }
    if (comp?.type === "BODY") {
      if (typeof comp?.add_security_recommendation === "boolean") {
        parsed.authConfig = parsed.authConfig || {
          otpType: "COPY_CODE",
          addSecurityRecommendation: true,
          includeExpirationWarning: true,
          expiresInMinutes: 10,
          supportedApps: [],
        };
        parsed.authConfig.addSecurityRecommendation = comp.add_security_recommendation;
      }
      parsed.bodyText = String(comp?.text || parsed.bodyText);
    }
    if (comp?.type === "FOOTER") {
      parsed.footerText = String(comp?.text || "");
      if (typeof comp?.code_expiration_minutes !== "undefined") {
        parsed.authConfig = parsed.authConfig || {
          otpType: "COPY_CODE",
          addSecurityRecommendation: true,
          includeExpirationWarning: true,
          expiresInMinutes: 10,
          supportedApps: [],
        };
        parsed.authConfig.includeExpirationWarning = true;
        parsed.authConfig.expiresInMinutes = Number(comp.code_expiration_minutes) || 10;
      }
    }
    if (comp?.type === "BUTTONS" && Array.isArray(comp?.buttons)) {
      parsed.ctaButtons = comp.buttons.map((button: any, index: number) => ({
        id: `preview-${index}`,
        type: String(button?.type || "QUICK_REPLY") as any,
        text: String(button?.text || ""),
        url: String(button?.url || ""),
        phoneNumber: String(button?.phone_number || ""),
        ttlMinutes: String(button?.ttl_minutes || "43200"),
        flowId: String(button?.flow_id || ""),
        flowIcon: String(button?.icon || "DEFAULT").toUpperCase() as any,
        flowType: "",
        offerCode: "",
      }));

      const otp = comp.buttons.find((button: any) => {
        const type = String(button?.type || "").toUpperCase();
        return type === "OTP" || !!button?.otp_type || !!button?.otpType;
      });
      if (otp) {
        const otpType = String(otp?.otp_type || otp?.otpType || "COPY_CODE").toUpperCase();
        const supportedApps = Array.isArray(otp?.supported_apps)
          ? otp.supported_apps
          : otp?.package_name || otp?.signature_hash
            ? [{ package_name: otp?.package_name, signature_hash: otp?.signature_hash }]
            : [];
        parsed.authConfig = parsed.authConfig || {
          otpType: "COPY_CODE",
          addSecurityRecommendation: true,
          includeExpirationWarning: false,
          expiresInMinutes: 10,
          supportedApps: [],
        };
        if (otpType === "ZERO_TAP" || otpType === "ONE_TAP" || otpType === "COPY_CODE") {
          parsed.authConfig.otpType = otpType;
        }
        parsed.authConfig.supportedApps = supportedApps.map((app: any, index: number) => ({
          id: `auth-app-${index}`,
          packageName: String(app?.package_name || ""),
          signatureHash: String(app?.signature_hash || ""),
        }));
      }
    }
  }
  return parsed;
}
