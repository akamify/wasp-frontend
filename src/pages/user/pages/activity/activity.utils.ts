import { extractMetaDebugFields, formatMetaDebugInline, isMetaBillingEligibilityPaymentIssue } from "@shared/utils/metaErrors";

export function stripUrls(text: string) {
  return String(text || "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstString(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return firstString(value[0]);
  if (typeof value === "object") {
    if (typeof value.providerError === "string") return value.providerError;
    if (typeof value.message === "string") return value.message;
    if (typeof value.title === "string") return value.title;
  }
  return String(value || "");
}

function extractFirstUrl(text: string) {
  const m = String(text || "").match(/https?:\/\/\S+/i);
  return m ? m[0] : "";
}

export function summarizeActivityError(rawError: any) {
  const err = Array.isArray(rawError) ? rawError[0] : rawError;
  const rawMessage =
    firstString(err) ||
    String(err?.metaDebug?.meta?.error_user_msg || err?.metaDebug?.meta?.message || err?.error_data?.details || "");

  const lower = rawMessage.toLowerCase();
  const debug = formatMetaDebugInline(extractMetaDebugFields(err));

  const href =
    (typeof err?.href === "string" && err.href) ||
    extractFirstUrl(String(err?.error_data?.details || "")) ||
    extractFirstUrl(rawMessage) ||
    "";

  if (lower.includes("no payment method is set up") || lower.includes("billing_hub") || lower.includes("add_pm")) {
    return {
      title: "Payment setup required",
      description: "Your WhatsApp Business Account needs a payment method in Meta to send paid template messages.",
      href,
      debug,
    };
  }

  if (isMetaBillingEligibilityPaymentIssue(rawMessage)) {
    return {
      title: "Meta eligibility / billing issue",
      description:
        "Meta has blocked template messaging due to business eligibility or payment status. Complete billing setup/verification in Meta Business Manager.",
      href,
      debug,
    };
  }

  if (lower.includes("issue with the parameters") || (lower.includes("template") && lower.includes("parameter"))) {
    return {
      title: "Template parameters invalid",
      description: "Your template variables/buttons don’t match the approved template structure. Re-check placeholder counts and button values.",
      href: "",
      debug,
    };
  }

  return {
    title: "Send failed",
    description: stripUrls(rawMessage) || "An unknown error occurred during processing.",
    href: href || "",
    debug,
  };
}
