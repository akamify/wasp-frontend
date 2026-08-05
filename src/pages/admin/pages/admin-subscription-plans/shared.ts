import { formatCurrencyFromPaise } from "@shared/config/currency";

export const PLAN_STATUSES = ["draft", "in_review", "published", "archived", "disabled"];
export const BILLING_CYCLES = ["monthly", "quarterly", "yearly", "lifetime"];
export const TAX_MODES = ["exclusive", "inclusive", "none"];
export const BADGE_TYPES = ["none", "popular", "best_value", "recommended", "limited_offer", "enterprise", "coming_soon"];
export const CARD_COLORS = ["blue", "green", "purple", "gold", "slate"];
export const PLAN_OPTIONS = [
  { name: "Free", slug: "free", sortOrder: 1 },
  { name: "Basic", slug: "basic", sortOrder: 2 },
  { name: "Pro", slug: "pro", sortOrder: 3 },
  { name: "Premium", slug: "premium", sortOrder: 4 },
  { name: "Unlimited", slug: "unlimited", sortOrder: 5 },
] as const;

export const FEATURE_GROUPS = [
  {
    title: "Page Permissions",
    items: [
      ["dashboardPageAccess", "Dashboard"],
      ["contactsPageAccess", "Contacts"],
      ["templatesPageAccess", "Templates"],
      ["campaignsPageAccess", "Campaigns Page"],
      ["inboxPageAccess", "Inbox"],
      ["crmPageAccess", "CRM Page"],
      ["flowsPageAccess", "Flow Builder"],
      ["automationPageAccess", "Automation"],
      ["aiAgentsPageAccess", "AI Agents"],
      ["walletPageAccess", "Wallet"],
      ["linksPageAccess", "Links"],
      ["activityPageAccess", "Activity"],
      ["apiKeysPageAccess", "API Keys"],
      ["apiReportsPageAccess", "API Reports"],
    ],
  },
  {
    title: "Feature Permissions",
    items: [
      ["campaignApiAccess", "Campaign API"],
      ["externalChatApiAccess", "External Chat API"],
      ["exportAccess", "Export"],
      ["campaignSchedulerAccess", "Campaign Scheduler"],
      ["csvCampaignSchedulerAccess", "CSV Campaign Scheduler"],
      ["smartAgentRoutingAccess", "Smart Agent Routing"],
      ["multiAgentInboxAccess", "Multi-Agent Inbox"],
      ["leadDistributionAccess", "Lead Distribution"],
      ["employeeAccess", "Employee Access"],
    ],
  },
] as const;

export const FUNCTIONALITY_KEYS = FEATURE_GROUPS.flatMap((group) => group.items.map(([key]) => key));

export const LIMIT_GROUPS = [
  {
    title: "Workspace Limits",
    items: [
      ["maxContacts", "Contacts"],
      ["maxTemplates", "Templates"],
      ["maxTags", "Tags"],
      ["maxCustomAttributes", "Custom Attributes"],
      ["maxStorageMb", "Storage MB"],
    ],
  },
  {
    title: "Messaging & Runtime Limits",
    items: [
      ["maxAgents", "CRM Seats"],
      ["maxCampaignsPerMonth", "Campaigns / Month"],
      ["messageRatePerSec", "Messages / Sec"],
      ["maxWebhooks", "Webhooks"],
      ["maxApiKeys", "API Keys"],
      ["maxFlows", "Flows"],
      ["maxContactsExport", "Contact Exports / Month"],
      ["maxMediaSizeMb", "Media Size MB"],
      ["dailyMessageLimit", "Daily Message Limit"],
    ],
  },
] as const;

export const LIMIT_KEYS = LIMIT_GROUPS.flatMap((group) => group.items.map(([key]) => key));
export const LIMIT_HELP: Record<string, string> = {
  maxContacts: "Maximum contacts stored in the workspace. Deleting contacts frees capacity.",
  maxTemplates: "Maximum active workspace templates stored in the workspace. Deleting templates frees capacity.",
  maxCampaignsPerMonth: "Monthly cap for campaigns created by the workspace.",
  maxAgents: "Maximum active CRM or AI agent seats where this shared seat limit is used.",
  maxTags: "Maximum unique contact tags allowed for segmentation.",
  maxCustomAttributes: "Maximum custom contact fields such as city, order ID, lead source.",
  messageRatePerSec: "Campaign sender speed cap per workspace. Backend rate limiter uses this value.",
  maxWebhooks: "Maximum webhook endpoints allowed for real-time message/status events.",
  maxApiKeys: "Maximum project/developer API keys that can be created.",
  maxFlows: "Maximum automation/chatflow count allowed.",
  maxContactsExport: "Monthly CSV/contact export cap.",
  maxStorageMb: "Workspace storage cap in MB. Counts uploaded media, template media, and knowledge files.",
  maxMediaSizeMb: "Maximum upload/media file size in MB. Backend rejects files above this limit.",
  dailyMessageLimit: "Daily outbound message cap across manual, API, campaign, and automation sends.",
};
export const PAGE_ACCESS_OPTIONS = ["dashboardPageAccess", "templatesPageAccess", "campaignsPageAccess", "contactsPageAccess", "inboxPageAccess", "crmPageAccess", "flowsPageAccess", "walletPageAccess", "linksPageAccess", "automationPageAccess", "aiAgentsPageAccess", "activityPageAccess", "apiKeysPageAccess", "apiReportsPageAccess"];
export const PAGE_BINDING: Record<string, { functionality: string[]; limits: string[] }> = {
  dashboardPageAccess: { functionality: [], limits: [] },
  templatesPageAccess: { functionality: [], limits: ["maxTemplates"] },
  campaignsPageAccess: { functionality: ["campaignApiAccess", "campaignSchedulerAccess", "csvCampaignSchedulerAccess"], limits: ["maxCampaignsPerMonth", "messageRatePerSec", "dailyMessageLimit"] },
  contactsPageAccess: { functionality: [], limits: ["maxContacts", "maxContactsExport"] },
  inboxPageAccess: { functionality: ["multiAgentInboxAccess"], limits: ["dailyMessageLimit", "maxMediaSizeMb"] },
  crmPageAccess: { functionality: ["employeeAccess", "leadDistributionAccess"], limits: ["maxAgents"] },
  flowsPageAccess: { functionality: [], limits: ["maxFlows", "maxMediaSizeMb"] },
  walletPageAccess: { functionality: [], limits: [] },
  linksPageAccess: { functionality: [], limits: [] },
  automationPageAccess: { functionality: [], limits: [] },
  aiAgentsPageAccess: { functionality: [], limits: [] },
  activityPageAccess: { functionality: [], limits: [] },
  apiKeysPageAccess: { functionality: ["externalChatApiAccess"], limits: ["maxApiKeys", "maxWebhooks", "dailyMessageLimit", "maxMediaSizeMb"] },
  apiReportsPageAccess: { functionality: ["exportAccess"], limits: [] },
};

export const UNLIMITED_ALLOWED_LIMITS = new Set([
  "maxContacts",
  "maxTemplates",
  "maxCampaignsPerMonth",
  "maxAgents",
  "maxContactsExport",
  "maxTags",
  "maxCustomAttributes",
  "maxFlows",
]);

export type FeatureRow = { label: string; type: "functionality" | "limit" | "text"; functionalityKey: string; limitKey: string; value: string; included: boolean; sortOrder: number; unlimited: boolean };
export const createRow = (): FeatureRow => ({ label: "", type: "text", functionalityKey: "", limitKey: "", value: "", included: true, sortOrder: 0, unlimited: false });
export const defaultFeatures = () => Object.fromEntries(FUNCTIONALITY_KEYS.map((key) => [key, false]));
export const defaultLimits = () => Object.fromEntries(LIMIT_KEYS.map((key) => [key, "0"]));
export const defaultUnlimitedLimits = () => Object.fromEntries(LIMIT_KEYS.map((key) => [key, false]));
export const inr = (paise?: number | null) => (paise == null ? "-" : `Rs ${Math.round(Number(paise) / 100).toLocaleString("en-IN")}`);
export const statusColor = (status: string) => status === "published" ? "text-emerald-700" : status === "in_review" ? "text-amber-700" : status === "disabled" ? "text-rose-700" : status === "archived" ? "text-slate-400" : "text-slate-700";
export function dedupeBy<T>(items: T[], keyGetter: (item: T) => string) { const seen = new Set<string>(); const out: T[] = []; for (const item of items) { const key = keyGetter(item); if (!key || seen.has(key)) continue; seen.add(key); out.push(item); } return out; }
export const linesToArray = (value: string) => String(value || "").split("\n").map((line) => line.trim()).filter(Boolean);
export const arrayToLines = (value: unknown) => Array.isArray(value) ? value.filter(Boolean).join("\n") : "";
