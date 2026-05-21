export function addonStatusLabel(enabled: boolean): "Yes" | "No" {
  return enabled ? "Yes" : "No";
}

export function isHighImpactAddon(key: string): boolean {
  const highImpact = new Set(["razorpayPayments", "metaIntegration", "brevoEmail", "maintenanceMode"]);
  return highImpact.has(String(key || ""));
}
