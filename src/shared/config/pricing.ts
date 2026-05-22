// Pricing is DB-driven via /billing/plans.
// This module is kept only for compatibility with legacy imports.
export const PLAN_AMOUNT_STARTER: null = null;
export const PLAN_AMOUNT_GROWTH: null = null;
export const PLAN_AMOUNT_ENTERPRISE: "custom" = "custom";
export const PLAN_PER = "/month";

export function getPlanDisplayPrice() {
  return "Custom";
}

