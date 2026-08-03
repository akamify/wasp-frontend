import { extractVariableIndexes, isValidHttpsSampleUrl } from "@modules/templates/utils/helpers";

type Check = {
  key: string;
  label: string;
  passed: boolean;
  details: string;
};

function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function isSequential(indexes: number[]) {
  return indexes.every((value, index) => value === index + 1);
}

export function buildTemplateSubmissionChecks(template: {
  category?: string;
  components?: any[];
}, mode: "meta" | "local" = "meta") {
  const category = String(template?.category || "").toLowerCase();
  const components = asArray(template?.components);
  const body = components.find((component: any) => String(component?.type || "").toUpperCase() === "BODY");
  const header = components.find((component: any) => String(component?.type || "").toUpperCase() === "HEADER");
  const footer = components.find((component: any) => String(component?.type || "").toUpperCase() === "FOOTER");
  const buttonsComponent = components.find((component: any) => String(component?.type || "").toUpperCase() === "BUTTONS");
  const buttons = asArray<any>(buttonsComponent?.buttons);

  const bodyText = String(body?.text || "");
  const headerText = String(header?.text || "");
  const headerFormat = String(header?.format || "").toUpperCase();
  const headerMediaValue = String(header?.example?.header_handle?.[0] || "").trim();
  const headerMediaIsUrl = /^https?:\/\//i.test(headerMediaValue);
  const bodyIndexes = extractVariableIndexes(bodyText);
  const headerIndexes = extractVariableIndexes(headerText);
  const dynamicUrlButtons = buttons.filter((button: any) => extractVariableIndexes(String(button?.url || "")).length > 0);
  const otpButton = buttons.find((button: any) => {
    const type = String(button?.type || "").toUpperCase();
    return type === "OTP" || !!button?.otp_type || !!button?.otpType;
  });
  const supportedApps = Array.isArray(otpButton?.supported_apps)
    ? otpButton.supported_apps
    : otpButton?.package_name || otpButton?.signature_hash
      ? [{ package_name: otpButton?.package_name, signature_hash: otpButton?.signature_hash }]
      : [];

  const checks: Check[] = [];

  checks.push({
    key: "variables",
    label: "Variables",
    passed:
      category === "authentication"
        ? true
        : isSequential(bodyIndexes) &&
          bodyIndexes.length === 0
            ? true
            : bodyIndexes.every((_, index) => !!String(body?.example?.body_text?.[0]?.[index] || "").trim()) &&
              isSequential(headerIndexes) &&
              headerIndexes.length <= 1,
    details:
      category === "authentication"
        ? "Authentication templates do not use body/header text variables."
        : bodyIndexes.length || headerIndexes.length
          ? "Variable order and examples are present for text placeholders."
          : "No dynamic text variables found.",
  });

  const headerPassed =
    category === "authentication"
      ? true
      : !header
        ? true
        : headerFormat === "TEXT"
          ? !!headerText.trim() && headerIndexes.length <= 1
          : ["IMAGE", "VIDEO", "DOCUMENT"].includes(headerFormat)
            ? !!String(header?.example?.header_handle?.[0] || "").trim()
            : headerFormat === "LOCATION"
              ? Number.isFinite(Number(header?.example?.header_handle?.[0]?.latitude)) &&
                Number.isFinite(Number(header?.example?.header_handle?.[0]?.longitude))
              : false;
  checks.push({
    key: "header",
    label: "Header",
    passed: headerPassed,
    details:
      category === "authentication"
        ? "Authentication templates do not require a custom header."
        : !header
          ? "No header attached."
          : `Header configuration looks valid for ${headerFormat || "NONE"}.`,
  });

  const buttonTypeCounts = buttons.reduce<Map<string, number>>((map, button: any) => {
    const type = String(button?.type || "").toUpperCase();
    map.set(type, (map.get(type) || 0) + 1);
    return map;
  }, new Map<string, number>());
  const buttonsPassed =
    buttons.length <= 10 &&
    (buttonTypeCounts.get("URL") || 0) <= 2 &&
    (buttonTypeCounts.get("PHONE_NUMBER") || 0) <= 1 &&
    (buttonTypeCounts.get("VOICE_CALL") || 0) <= 1 &&
    (buttonTypeCounts.get("FLOW") || 0) <= 1 &&
    (buttonTypeCounts.get("COPY_CODE") || 0) <= 1 &&
    buttons.every((button: any) => {
      const type = String(button?.type || "").toUpperCase();
      const text = String(button?.text || "").trim();
      if (!text) return false;
      if (type === "URL") {
        const url = String(button?.url || "").trim();
        return !!url && extractVariableIndexes(url).length <= 1;
      }
      if (type === "PHONE_NUMBER") return !!String(button?.phone_number || button?.phoneNumber || "").trim();
      if (type === "FLOW") return !!String(button?.flow_id || button?.flowId || "").trim();
      return true;
    });
  checks.push({
    key: "buttons",
    label: "Buttons",
    passed: category === "authentication" ? !!otpButton : buttonsPassed,
    details:
      category === "authentication"
        ? "Authentication button setup is present."
        : buttons.length
          ? "Button limits and required fields are satisfied."
          : "No buttons attached.",
  });

  const mediaPassed =
    category === "authentication"
      ? true
      : ["IMAGE", "VIDEO", "DOCUMENT"].includes(headerFormat)
        ? !!headerMediaValue && (mode === "local" || !headerMediaIsUrl)
        : true;
  checks.push({
    key: "media",
    label: "Media",
    passed: mediaPassed,
    details:
      ["IMAGE", "VIDEO", "DOCUMENT"].includes(headerFormat)
        ? mode === "local"
          ? "Media header has a local library asset attached."
          : headerMediaIsUrl
            ? "This media came from the template library. Re-upload it in your workspace before submitting to Meta."
            : "Media header has an attached Meta handle/example."
        : "No media dependency found.",
  });

  const headerExamplesOkay =
    headerFormat !== "TEXT" || headerIndexes.length === 0
      ? true
      : Array.isArray(header?.example?.header_text) &&
        header.example.header_text.length === headerIndexes.length &&
        header.example.header_text.every((value: unknown) => !!String(value || "").trim());
  const bodyExamplesOkay =
    category === "authentication" || bodyIndexes.length === 0
      ? true
      : Array.isArray(body?.example?.body_text?.[0]) &&
        body.example.body_text[0].length === bodyIndexes.length &&
        body.example.body_text[0].every((value: unknown) => !!String(value || "").trim());
  const dynamicExamplesOkay = dynamicUrlButtons.every((button: any) => {
    const sample = String(button?.example?.[0] || "").trim();
    return !!sample && isValidHttpsSampleUrl(sample);
  });
  checks.push({
    key: "examples",
    label: "Examples",
    passed: headerExamplesOkay && bodyExamplesOkay && dynamicExamplesOkay,
    details: "Header/body/dynamic URL examples are ready for Meta review.",
  });

  const expires = Number(footer?.code_expiration_minutes ?? footer?.codeExpirationMinutes ?? "");
  const authenticationPassed =
    category !== "authentication" ||
    (!!otpButton &&
      (() => {
        const otpType = String(otpButton?.otp_type || otpButton?.otpType || "COPY_CODE").toUpperCase();
        if (otpType === "COPY_CODE") return true;
        return (
          supportedApps.length >= 1 &&
          supportedApps.length <= 5 &&
          supportedApps.every((app: any) =>
            !!String(app?.package_name || "").trim() &&
            String(app?.signature_hash || "").trim().length === 11
          ) &&
          (!Number.isFinite(expires) || (expires >= 1 && expires <= 90))
        );
      })());
  checks.push({
    key: "authentication",
    label: "Authentication",
    passed: authenticationPassed,
    details:
      category === "authentication"
        ? "OTP mode, supported apps, and expiration settings are valid."
        : "Not an authentication template.",
  });

  return {
    checks,
    passed: checks.every((check) => check.passed) && !!body,
  };
}
