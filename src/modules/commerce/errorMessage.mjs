export function commerceErrorMessage(error) {
  const data = error?.response?.data || {};
  const details = data?.details || {};
  const message = data?.message || error?.userMessage || "The request could not be completed. Refresh its status before retrying.";
  const fields = Array.isArray(details.fields) ? details.fields.filter(Boolean) : [];
  if (fields.length) return `${message}: ${fields.join(", ")}`;

  const diagnostics = [];
  if (typeof details.diagnosticCode === "string" && details.diagnosticCode) {
    diagnostics.push(`Diagnostic: ${details.diagnosticCode}`);
  }
  if (typeof details.requestedCatalogId === "string" && details.requestedCatalogId) {
    diagnostics.push(`Requested catalog: ${details.requestedCatalogId}`);
  }
  const authorizedCatalogIds = Array.isArray(details.authorizedCatalogIds)
    ? details.authorizedCatalogIds.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  if (authorizedCatalogIds.length) {
    diagnostics.push(`Authorized catalogs: ${authorizedCatalogIds.join(", ")}`);
  }
  if (typeof details.providerTraceId === "string" && details.providerTraceId) {
    diagnostics.push(`Meta trace: ${details.providerTraceId}`);
  }
  return diagnostics.length ? `${message} ${diagnostics.join(". ")}.` : message;
}
