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
    title: "WhatsApp",
    items: [
      ["dashboardPageAccess", "Dashboard"],
      ["templatesPageAccess", "Templates"],
      ["contactsPageAccess", "Contacts"],
      ["inboxPageAccess", "Live Chat Inbox"],
      ["whatsAppBroadcastAccess", "Broadcasting"],
      ["clickToWhatsAppAdsAccess", "Click-to-WhatsApp Ads"],
      ["templateMessageApiAccess", "Template Message APIs"],
      ["liveChatAccess", "Live Chat"],
      ["multiAgentInboxAccess", "Multi-Agent Inbox"],
    ],
  },
  {
    title: "Campaign",
    items: [
      ["campaignsPageAccess", "Campaigns Page"],
      ["smartAudienceSegregationAccess", "Smart Audience Segregation"],
      ["broadcastRetargetingAccess", "Broadcasting & Retargeting"],
      ["smartCampaignManagerAccess", "Smart Campaign Manager"],
      ["campaignSchedulerAccess", "Campaign Scheduler"],
      ["campaignClickTrackingAccess", "Campaign Click Tracking"],
      ["csvCampaignSchedulerAccess", "CSV Campaign Scheduler"],
      ["carouselClickTrackingAccess", "Carousel Click Tracking"],
      ["automaticFailedRetryAccess", "Automatic Failed Retry"],
      ["duplicateCsvContactsAccess", "Duplicate CSV Contacts"],
    ],
  },
  {
    title: "Automation",
    items: [
      ["automationPageAccess", "Automation Page"],
      ["flowsPageAccess", "Flow Builder"],
      ["automationAccess", "Automation Access"],
      ["smartAgentRoutingAccess", "Smart Agent Routing"],
      ["customAgentRulesAccess", "Custom Agent Rules"],
      ["multiCtwaChatflowTriggerAccess", "Multiple Meta-Ad Chatflow Trigger"],
      ["chatflowDelayAccess", "Time Delay in Chatflow"],
      ["chatflowTimeoutAccess", "Timeout in Chatflow"],
    ],
  },
  {
    title: "CRM & Team",
    items: [
      ["crmPageAccess", "CRM Page"],
      ["crmAccess", "CRM Access"],
      ["employeeAccess", "Agent Seats"],
      ["leadDistributionAccess", "Lead Distribution"],
      ["userAccessControlAccess", "User Access Control"],
      ["numberMaskingAccess", "Number Masking"],
    ],
  },
  {
    title: "API & Reports",
    items: [
      ["apiKeysPageAccess", "API Keys Page"],
      ["apiReportsPageAccess", "API Reports Page"],
      ["campaignApiAccess", "Campaign API"],
      ["externalChatApiAccess", "External Chat API"],
      ["projectApiAccess", "Project APIs"],
      ["webhookAccess", "Webhooks"],
      ["webhookApiAccess", "Webhook API"],
      ["developerApiAccess", "Developer APIs"],
      ["analyticsAccess", "Analytics"],
      ["downloadReportsAccess", "Download Reports"],
      ["exportAccess", "Export"],
    ],
  },
  {
    title: "Premium",
    items: [
      ["templateTtlAccess", "Template TTL"],
      ["prioritySupportAccess", "Priority Support"],
      ["turboOnboardingAccess", "Turbo Onboarding"],
      ["dedicatedAccountManagerAccess", "Dedicated Account Manager"],
      ["whiteLabelAccess", "White Label"],
      ["walletPageAccess", "Wallet Page"],
      ["linksPageAccess", "Links Page"],
      ["activityPageAccess", "Activity Page"],
    ],
  },
] as const;

export const FUNCTIONALITY_KEYS = FEATURE_GROUPS.flatMap((group) => group.items.map(([key]) => key));

export const LIMIT_GROUPS = [
  {
    title: "Core Limits",
    items: [
      ["maxContacts", "Contacts"],
      ["maxTemplates", "Templates"],
      ["maxCampaignsPerMonth", "Campaigns / Month"],
      ["maxAgents", "Agents"],
      ["maxTags", "Tags"],
      ["maxCustomAttributes", "Custom Attributes"],
    ],
  },
  {
    title: "Scale Limits",
    items: [
      ["messageRatePerSec", "Messages / Sec"],
      ["maxWebhooks", "Webhooks"],
      ["maxApiKeys", "API Keys"],
      ["maxFlows", "Flows"],
      ["maxTeams", "Teams"],
      ["maxContactsExport", "Contact Exports / Month"],
      ["maxStorageMb", "Storage MB"],
      ["maxProjects", "Projects"],
      ["maxMediaSizeMb", "Media Size MB"],
      ["dailyMessageLimit", "Daily Message Limit"],
    ],
  },
] as const;

export const LIMIT_KEYS = LIMIT_GROUPS.flatMap((group) => group.items.map(([key]) => key));
export const LIMIT_HELP: Record<string, string> = {
  maxContacts: "Maximum contacts this workspace can create or manage under the plan.",
  maxTemplates: "Maximum approved/synced WhatsApp templates allowed for plan usage.",
  maxCampaignsPerMonth: "Monthly cap for campaigns created by the workspace.",
  maxAgents: "Maximum active CRM/live-chat agent seats. Use 0 to block agents.",
  maxTags: "Maximum unique contact tags allowed for segmentation.",
  maxCustomAttributes: "Maximum custom contact fields such as city, order ID, lead source.",
  messageRatePerSec: "Campaign sender speed cap per workspace. Backend rate limiter uses this value.",
  maxWebhooks: "Maximum webhook endpoints allowed for real-time message/status events.",
  maxApiKeys: "Maximum project/developer API keys that can be created.",
  maxFlows: "Maximum automation/chatflow count allowed.",
  maxTeams: "Maximum teams or groups for internal access/routing.",
  maxContactsExport: "Monthly CSV/contact export cap.",
  maxStorageMb: "Storage cap for files/media in MB.",
  maxProjects: "Maximum projects/workspaces-like developer projects allowed.",
  maxMediaSizeMb: "Maximum upload/media file size in MB.",
  dailyMessageLimit: "Daily outbound message cap across campaigns/API where enforced.",
};
export const PAGE_ACCESS_OPTIONS = ["dashboardPageAccess", "templatesPageAccess", "campaignsPageAccess", "contactsPageAccess", "inboxPageAccess", "crmPageAccess", "flowsPageAccess", "walletPageAccess", "linksPageAccess", "automationPageAccess", "activityPageAccess", "apiKeysPageAccess", "apiReportsPageAccess"];
export const PAGE_BINDING: Record<string, { functionality: string[]; limits: string[] }> = {
  dashboardPageAccess: { functionality: [], limits: [] },
  templatesPageAccess: { functionality: [], limits: ["maxTemplates"] },
  campaignsPageAccess: { functionality: ["campaignApiAccess"], limits: ["maxCampaignsPerMonth"] },
  contactsPageAccess: { functionality: [], limits: ["maxContacts", "maxContactsExport"] },
  inboxPageAccess: { functionality: ["apiKeyAccess"], limits: [] },
  crmPageAccess: { functionality: ["crmAccess", "employeeAccess", "leadDistributionAccess"], limits: ["maxAgents"] },
  flowsPageAccess: { functionality: ["automationAccess"], limits: ["maxFlows"] },
  walletPageAccess: { functionality: [], limits: [] },
  linksPageAccess: { functionality: ["analyticsAccess"], limits: [] },
  automationPageAccess: { functionality: ["automationAccess"], limits: [] },
  activityPageAccess: { functionality: ["analyticsAccess"], limits: [] },
  apiKeysPageAccess: { functionality: ["apiKeyAccess"], limits: ["maxApiKeys"] },
  apiReportsPageAccess: { functionality: ["analyticsAccess"], limits: [] },
};

export type FeatureRow = { label: string; type: "page" | "text"; pageAccessKey: string; targetType: "functionality" | "limit" | ""; functionalityKey: string; limitKey: string; value: string; included: boolean; sortOrder: number; unlimited: boolean };
export const createRow = (): FeatureRow => ({ label: "", type: "text", pageAccessKey: "", targetType: "", functionalityKey: "", limitKey: "", value: "", included: true, sortOrder: 0, unlimited: false });
export const defaultFeatures = () => Object.fromEntries(FUNCTIONALITY_KEYS.map((key) => [key, false]));
export const defaultLimits = () => Object.fromEntries(LIMIT_KEYS.map((key) => [key, "0"]));
export const inr = (paise?: number | null) => formatCurrencyFromPaise(paise, "INR");
export const statusColor = (status: string) => status === "published" ? "text-emerald-700" : status === "in_review" ? "text-amber-700" : status === "disabled" ? "text-rose-700" : status === "archived" ? "text-slate-400" : "text-slate-700";
export function dedupeBy<T>(items: T[], keyGetter: (item: T) => string) { const seen = new Set<string>(); const out: T[] = []; for (const item of items) { const key = keyGetter(item); if (!key || seen.has(key)) continue; seen.add(key); out.push(item); } return out; }
export const linesToArray = (value: string) => String(value || "").split("\n").map((line) => line.trim()).filter(Boolean);
export const arrayToLines = (value: unknown) => Array.isArray(value) ? value.filter(Boolean).join("\n") : "";
