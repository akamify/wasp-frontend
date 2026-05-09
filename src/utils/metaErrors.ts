type MetaDebugFields = {
  code?: number | null;
  error_subcode?: number | null;
  fbtrace_id?: string | null;
};

function asLowerString(value: unknown) {
  return String(value ?? "").toLowerCase();
}

export function isMetaBillingEligibilityPaymentIssue(value: unknown): boolean {
  const s = asLowerString(value);
  return s.includes("business eligibility payment issue");
}

export function extractMetaDebugFields(error: any): MetaDebugFields {
  // Supports both:
  // - backend `buildDetails()` format (providerError/code/error_subcode/fbtrace_id)
  // - raw Meta error shapes nested under metaDebug/raw/response
  const direct: MetaDebugFields = {
    code: Number.isFinite(Number(error?.code)) ? Number(error.code) : null,
    error_subcode: Number.isFinite(Number(error?.error_subcode)) ? Number(error.error_subcode) : null,
    fbtrace_id: error?.fbtrace_id ? String(error.fbtrace_id) : null,
  };

  const nested = error?.metaDebug?.meta || error?.metaDebug?.raw?.error || error?.response?.data?.error || null;
  if (!nested) return direct;

  return {
    code: direct.code ?? (Number.isFinite(Number(nested?.code)) ? Number(nested.code) : null),
    error_subcode:
      direct.error_subcode ?? (Number.isFinite(Number(nested?.error_subcode)) ? Number(nested.error_subcode) : null),
    fbtrace_id: direct.fbtrace_id ?? (nested?.fbtrace_id ? String(nested.fbtrace_id) : null),
  };
}

export function formatMetaDebugInline(fields: MetaDebugFields): string {
  const parts: string[] = [];
  if (fields.code != null) parts.push(`code ${fields.code}`);
  if (fields.error_subcode != null) parts.push(`subcode ${fields.error_subcode}`);
  if (fields.fbtrace_id) parts.push(`fbtrace ${fields.fbtrace_id}`);
  return parts.length ? parts.join(" · ") : "";
}

