export type RequiredPlan = "basic" | "pro";
export type RequiredFeatureKey =
  | "dashboardPageAccess"
  | "templatesPageAccess"
  | "campaignsPageAccess"
  | "contactsPageAccess"
  | "inboxPageAccess"
  | "crmPageAccess"
  | "flowsPageAccess"
  | "walletPageAccess"
  | "linksPageAccess"
  | "automationPageAccess"
  | "aiAgentsPageAccess"
  | "activityPageAccess"
  | "apiKeysPageAccess"
  | "apiReportsPageAccess";

export function requiredPlanForPath(pathname: string): RequiredPlan | null {
  if (
    pathname.startsWith("/app/meta") ||
    pathname.startsWith("/app/profile") ||
    pathname.startsWith("/app/settings") ||
    pathname.startsWith("/app/plan") ||
    pathname.startsWith("/app/pricing") ||
    pathname === "/app" ||
    pathname.startsWith("/app/dashboard") ||
    pathname.startsWith("/app/templates") ||
    pathname.startsWith("/app/send") ||
    pathname.startsWith("/app/contacts") ||
    pathname.startsWith("/app/conversations") ||
    pathname.startsWith("/app/wallet")
  ) return null;
  if (pathname.startsWith("/app/crm")) return "pro";
  if (pathname.startsWith("/app/flows")) return "pro";
  if (pathname.startsWith("/app/links")) return "pro";
  if (pathname.startsWith("/app/automation")) return "pro";
  if (pathname.startsWith("/app/ai-agents")) return "pro";
  if (pathname.startsWith("/app/activity")) return "pro";
  if (pathname.startsWith("/app/api-keys")) return "pro";
  if (pathname.startsWith("/app/api-reports")) return "pro";
  return null;
}

export function requiredFeatureForPath(pathname: string): RequiredFeatureKey | null {
  if (pathname === "/app" || pathname.startsWith("/app/dashboard")) return "dashboardPageAccess";
  if (pathname.startsWith("/app/templates")) return "templatesPageAccess";
  if (pathname.startsWith("/app/send")) return "campaignsPageAccess";
  if (pathname.startsWith("/app/contacts")) return "contactsPageAccess";
  if (pathname.startsWith("/app/conversations")) return "inboxPageAccess";
  if (pathname.startsWith("/app/crm")) return "crmPageAccess";
  if (pathname.startsWith("/app/flows")) return "flowsPageAccess";
  if (pathname.startsWith("/app/wallet")) return "walletPageAccess";
  if (pathname.startsWith("/app/links")) return "linksPageAccess";
  if (pathname.startsWith("/app/automation")) return "automationPageAccess";
  if (pathname.startsWith("/app/ai-agents")) return "automationPageAccess";
  if (pathname.startsWith("/app/activity")) return "activityPageAccess";
  if (pathname.startsWith("/app/api-keys")) return "apiKeysPageAccess";
  if (pathname.startsWith("/app/api-reports")) return "apiReportsPageAccess";
  return null;
}

export function relativeTime(value?: string | null) {
  if (!value) return "";
  const t = new Date(value).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
