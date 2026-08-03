import type { TemplateItem } from "@modules/templates/types/templates.types";

function normalizeReason(reason: string) {
  return String(reason || "").trim();
}

export function summarizeRejectedReason(reason: string, max = 88) {
  const normalized = normalizeReason(reason);
  if (!normalized) return "Meta did not return a rejection reason.";
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1)}...`;
}

export function buildSuggestedFixes(template: Pick<TemplateItem, "category" | "components" | "rejectedReason">) {
  const suggestions = new Set<string>();
  const reason = normalizeReason(template.rejectedReason || "").toLowerCase();
  const components = Array.isArray(template.components) ? template.components : [];
  const body = components.find((component: any) => String(component?.type || "").toUpperCase() === "BODY");
  const header = components.find((component: any) => String(component?.type || "").toUpperCase() === "HEADER");
  const buttonsComponent = components.find((component: any) => String(component?.type || "").toUpperCase() === "BUTTONS");
  const buttons = Array.isArray(buttonsComponent?.buttons) ? buttonsComponent.buttons : [];

  if (!template.rejectedReason) {
    suggestions.add("Sync the latest template status from Meta to fetch the current rejection reason.");
  }
  if (reason.includes("variable") || reason.includes("placeholder") || reason.includes("parameter")) {
    suggestions.add("Check that variables are sequential like {{1}}, {{2}} and each variable has example data.");
  }
  if (reason.includes("header")) {
    suggestions.add("Review header format, variable count, and media/header example values before resubmitting.");
  }
  if (reason.includes("button") || reason.includes("url") || reason.includes("flow")) {
    suggestions.add("Verify button text, limits, URLs, and flow/button configuration against Meta requirements.");
  }
  if (reason.includes("marketing") || reason.includes("utility") || reason.includes("authentication") || reason.includes("category")) {
    suggestions.add("Make sure the selected category matches the actual message intent and content.");
  }
  if (reason.includes("policy") || reason.includes("commerce") || reason.includes("spam") || reason.includes("quality")) {
    suggestions.add("Rewrite the message to avoid promotional overclaiming, spam-like phrasing, or policy-sensitive wording.");
  }
  if (reason.includes("language") || reason.includes("locale")) {
    suggestions.add("Double-check the template language and ensure the content matches that locale.");
  }

  if (String(template.category || "").toLowerCase() === "authentication") {
    suggestions.add("For authentication templates, confirm OTP mode, supported apps, and expiration settings are valid.");
  } else {
    if (body?.text) suggestions.add("Review body copy for policy-safe wording and complete example values.");
    if (header) suggestions.add("Check header content and examples, especially if using text variables or media.");
    if (buttons.length) suggestions.add("Test each button configuration and remove any unnecessary button before resubmitting.");
  }

  suggestions.add("Open Fix to edit this template and resubmit it without creating a new template.");
  return Array.from(suggestions).slice(0, 6);
}
