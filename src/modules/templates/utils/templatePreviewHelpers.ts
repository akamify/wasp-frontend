import type { AuthSupportedApp, CtaButton, HeaderType } from "@modules/templates/types/templates.types";
import { extractVariableIndexes, normalizeFlowIcon } from "./helpers";

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
        urlExample: Array.isArray(button?.example) ? String(button.example?.[0] || "") : "",
        urlMode: extractVariableIndexes(String(button?.url || "")).length > 0 ? "dynamic" : "static",
        phoneNumber: String(button?.phone_number || ""),
        ttlMinutes: String(button?.ttl_minutes || "43200"),
        flowId: String(button?.flow_id || ""),
        flowIcon: normalizeFlowIcon(button?.icon),
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

