export type TemplateComponent = {
  type: string;
  format?: string;
  text?: string;
  buttons?: Array<{
    type: string;
    text?: string;
    url?: string;
    phone_number?: string;
    flow_id?: string;
    ttl_minutes?: number;
    otp_type?: string;
  }>;
};

export type TemplateRecord = {
  _id: string;
  name: string;
  language: string;
  category: "marketing" | "utility" | "authentication";
  status: "draft" | "pending" | "approved" | "rejected" | "paused" | "disabled";
  source?: "local" | "meta";
  components?: TemplateComponent[];
};

export function parseCommaList(raw: string): string[] {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function maxPlaceholderIndex(text?: string) {
  const source = String(text || "");
  const matches = source.matchAll(/\{\{(\d+)\}\}/g);
  let max = 0;

  for (const match of matches) {
    const index = Number(match[1]);
    if (Number.isFinite(index) && index > max) {
      max = index;
    }
  }

  return max;
}

export function hasDynamicUrl(url?: string) {
  return /\{\{\d+\}\}/.test(String(url || ""));
}

export function inspectTemplate(template?: TemplateRecord) {
  const summary = {
    headerVariableCount: 0,
    bodyVariableCount: 0,
    otpButtons: 0,
    dynamicUrlButtons: [] as Array<{ index: number; label: string }>,
    voiceCallButtons: [] as Array<{ index: number; label: string }>,
    flowButtons: [] as Array<{ index: number; label: string }>,
    copyCodeButtons: [] as Array<{ index: number; label: string }>,
    headerFormat: "NONE" as "NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT",
  };

  for (const component of template?.components || []) {
    const type = String(component.type || "").toUpperCase();
    const format = String(component.format || "").toUpperCase();

    if (type === "HEADER") {
      if (format === "TEXT") {
        summary.headerFormat = "TEXT";
      summary.headerVariableCount = Math.max(
        summary.headerVariableCount,
        maxPlaceholderIndex(component.text)
      );
      } else if (format === "IMAGE" || format === "VIDEO" || format === "DOCUMENT") {
        summary.headerFormat = format as any;
        summary.headerVariableCount = Math.max(summary.headerVariableCount, 1);
      }
    }

    if (type === "BODY") {
      summary.bodyVariableCount = Math.max(
        summary.bodyVariableCount,
        maxPlaceholderIndex(component.text)
      );
    }

    if (type === "BUTTONS") {
      (component.buttons || []).forEach((button, index) => {
        const buttonType = String(button.type || "").toUpperCase();
        if (buttonType === "OTP") {
          summary.otpButtons += 1;
        }
        if (buttonType === "URL" && hasDynamicUrl(button.url)) {
          summary.dynamicUrlButtons.push({
            index,
            label: button.text || `Button ${index + 1}`,
          });
        }
        if (buttonType === "VOICE_CALL") {
          summary.voiceCallButtons.push({
            index,
            label: button.text || `Button ${index + 1}`,
          });
        }
        if (buttonType === "FLOW") {
          summary.flowButtons.push({
            index,
            label: button.text || `Button ${index + 1}`,
          });
        }
        if (buttonType === "COPY_CODE") {
          summary.copyCodeButtons.push({
            index,
            label: button.text || `Button ${index + 1}`,
          });
        }
      });
    }
  }

  return summary;
}
