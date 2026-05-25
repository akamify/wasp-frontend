type TemplateComponent = {
  type: string;
  text?: string;
  buttons?: Array<{
    type: string;
    text?: string;
    url?: string;
  }>;
};

type Template = {
  _id: string;
  name: string;
  status: string;
  language: string;
  category: "marketing" | "utility" | "authentication";
  components?: TemplateComponent[];
};

export function parseCommaList(raw: string): string[] {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function maxPlaceholderIndex(text?: string) {
  const source = String(text || "");
  const matches = source.matchAll(/\{\{(\d+)\}\}/g);
  let max = 0;
  for (const match of matches) {
    const index = Number(match[1]);
    if (Number.isFinite(index) && index > max) max = index;
  }
  return max;
}

function hasDynamicUrl(url?: string) {
  return /\{\{\d+\}\}/.test(String(url || ""));
}

export function inspectTemplate(template?: Template) {
  const summary = { bodyVariableCount: 0, otpButtons: 0, dynamicUrlButtons: 0 };
  for (const component of template?.components || []) {
    if (String(component.type || "").toUpperCase() === "BODY") {
      summary.bodyVariableCount = Math.max(summary.bodyVariableCount, maxPlaceholderIndex(component.text));
    }
    if (String(component.type || "").toUpperCase() === "BUTTONS") {
      (component.buttons || []).forEach((button) => {
        const type = String(button.type || "").toUpperCase();
        if (type === "OTP") summary.otpButtons += 1;
        if (type === "URL" && hasDynamicUrl(button.url)) summary.dynamicUrlButtons += 1;
      });
    }
  }
  return summary;
}
