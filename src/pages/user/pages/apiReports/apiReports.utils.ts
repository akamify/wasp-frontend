import { AlertCircle, Check, CheckCheck, Clock3 } from "lucide-react";

export function truncate(value: any, max = 22) {
  const s = String(value ?? "");
  if (s.length <= max) return s;
  if (max <= 1) return s.slice(0, 1);
  return `${s.slice(0, max - 1)}…`;
}

export function fmtDate(value: any) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export function extractErrorMessage(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return extractErrorMessage(value[0]);
  return (
    value.providerError ||
    value.providerMessage ||
    value.message ||
    value.error?.message ||
    value.error_data?.details ||
    value.metaDebug?.meta?.error_user_msg ||
    value.metaDebug?.meta?.message ||
    value.metaDebug?.raw?.error?.error_data?.details ||
    value.metaDebug?.raw?.error?.message ||
    ""
  );
}

export function buildErrorViewModel(value: any) {
  const message = extractErrorMessage(value) || "Message delivery failed.";
  const code =
    value?.providerCode ||
    value?.error?.code ||
    value?.metaDebug?.meta?.code ||
    value?.metaDebug?.raw?.error?.code ||
    "";
  const subcode =
    value?.providerSubcode ||
    value?.error?.error_subcode ||
    value?.metaDebug?.meta?.error_subcode ||
    value?.metaDebug?.raw?.error?.error_subcode ||
    "";
  const traceId =
    value?.traceId ||
    value?.metaDebug?.meta?.fbtrace_id ||
    value?.metaDebug?.raw?.error?.fbtrace_id ||
    "";

  let guidance = "Verify template status, phone number format, and campaign payload.";
  const normalized = message.toLowerCase();
  if (normalized.includes("rate") || normalized.includes("throttle")) {
    guidance = "Rate limit hit. Retry after some time or reduce request burst.";
  } else if (normalized.includes("template")) {
    guidance = "Template issue. Check template approval status and variable mapping.";
  } else if (normalized.includes("phone") || normalized.includes("recipient")) {
    guidance = "Recipient issue. Validate country code and WhatsApp-enabled number.";
  } else if (normalized.includes("auth") || normalized.includes("token") || normalized.includes("permission")) {
    guidance = "Authorization issue. Reconnect Meta account and verify permissions.";
  }

  return {
    message,
    code: [code, subcode].filter(Boolean).join(" / "),
    traceId: String(traceId || ""),
    guidance,
  };
}

export function statusMeta(status: any, hasError: boolean) {
  const s = String(status || "").toLowerCase();
  if (hasError || s === "failed" || s === "timeout_unknown") {
    return { label: s || "failed", tone: "error" as const, Icon: AlertCircle };
  }
  if (s === "read") {
    return { label: s, tone: "good" as const, Icon: CheckCheck };
  }
  if (s === "delivered") {
    return { label: s, tone: "ok" as const, Icon: CheckCheck };
  }
  if (s === "sent" || s === "accepted") {
    return { label: s, tone: "progress" as const, Icon: Check };
  }
  return { label: s || "queued", tone: "pending" as const, Icon: Clock3 };
}
