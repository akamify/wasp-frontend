import { Bot, BriefcaseBusiness, CreditCard, FileSearch, FileText, History, Key, LayoutDashboard, Link2, ListFilter, MessageSquare, Send, Terminal, Users, Wallet, Workflow, Zap, Layers3 } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/app", label: "Dashboard", kicker: "overview", icon: LayoutDashboard },
  { to: "/app/meta", label: "WhatsApp Setup", kicker: "credentials", icon: Key },
  { to: "/app/templates", label: "Templates", kicker: "library", icon: FileText },
  { to: "/app/send", label: "Campaigns", kicker: "broadcast", icon: Send },
  { to: "/app/contacts", label: "Contacts", kicker: "audience", icon: Users },
  { to: "/app/audiences", label: "Audiences", kicker: "segments", icon: Layers3 },
  { to: "/app/attributes", label: "Attributes", kicker: "contact data", icon: ListFilter },
  { to: "/app/conversations", label: "Inbox", kicker: "chatroom", icon: MessageSquare },
  { to: "/app/crm", label: "CRM", kicker: "leads", icon: BriefcaseBusiness },
  { to: "/app/flows", label: "Flows", kicker: "forms", icon: Workflow },
  { to: "/app/wallet", label: "Wallet", kicker: "credits", icon: Wallet },
  { to: "/app/plan", label: "Plans & Billing", kicker: "subscription", icon: CreditCard },
  { to: "/app/links", label: "Tracked links", kicker: "analytics", icon: Link2 },
  { to: "/app/automation", label: "Automation", kicker: "chat flows", icon: Zap },
  { to: "/app/ai-agents", label: "AI Agents", kicker: "assistants", icon: Bot },
  { to: "/app/activity", label: "Activity", kicker: "audit logs", icon: History },
  { to: "/app/api-keys", label: "API Keys", kicker: "developer", icon: Terminal },
  { to: "/app/api-reports", label: "API Report", kicker: "api logs", icon: FileSearch },
];

export const MOBILE_TABS = [
  { to: "/app", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/app/send", label: "Campaigns", icon: Send, end: false },
  { to: "/app/conversations", label: "Inbox", icon: MessageSquare, end: false },
  { to: "/app/contacts", label: "Contacts", icon: Users, end: false },
];

const DOCS_BASE_URL = String(import.meta.env.VITE_DOCS_BASE_URL || "https://docs.aiwizchat.com").replace(/\/+$/, "");

type DocsSection = {
  id?: string;
  title?: string;
};

export type DocsLinkItem = {
  slug?: string;
  title?: string;
  description?: string;
  category?: string;
  sections?: DocsSection[];
};

type PageDocsRule = {
  prefix: string;
  docSlugs?: string[];
  docKeywords: string[];
  sectionIds?: string[];
  sectionKeywords?: string[];
};

const PAGE_DOC_RULES: PageDocsRule[] = [
  {
    prefix: "/app/meta",
    docSlugs: ["connect-whatsapp-business-account"],
    docKeywords: ["connect whatsapp", "whatsapp business account", "embedded signup", "meta"],
    sectionIds: ["connect-whatsapp"],
    sectionKeywords: ["connect whatsapp"],
  },
  {
    prefix: "/app/templates",
    docSlugs: ["whatsapp-templates"],
    docKeywords: ["whatsapp templates", "templates overview", "template lifecycle"],
    sectionIds: ["template-lifecycle"],
    sectionKeywords: ["template lifecycle", "create template"],
  },
  {
    prefix: "/app/send",
    docSlugs: ["campaigns"],
    docKeywords: ["campaigns", "campaigns overview", "create campaign"],
    sectionIds: ["create-campaign"],
    sectionKeywords: ["create campaign"],
  },
  {
    prefix: "/app/contacts",
    docSlugs: ["contacts"],
    docKeywords: ["contacts", "csv contact import"],
    sectionIds: ["csv-contact-import", "import-contacts"],
    sectionKeywords: ["csv contact import", "import contacts"],
  },
  {
    prefix: "/app/audiences",
    docSlugs: ["contacts", "public-feature-list"],
    docKeywords: ["contacts", "audiences", "public feature list"],
    sectionIds: ["audiences"],
    sectionKeywords: ["audiences"],
  },
  {
    prefix: "/app/attributes",
    docSlugs: ["contacts"],
    docKeywords: ["contacts", "contact attributes"],
    sectionIds: ["contact-attributes"],
    sectionKeywords: ["contact attributes"],
  },
  {
    prefix: "/app/conversations",
    docSlugs: ["sending-messages-from-inbox"],
    docKeywords: ["sending messages from inbox", "inbox sending"],
    sectionIds: ["inbox-sending"],
    sectionKeywords: ["inbox sending"],
  },
  {
    prefix: "/app/crm",
    docSlugs: ["crm-access"],
    docKeywords: ["crm access", "crm overview"],
    sectionIds: ["crm-overview"],
    sectionKeywords: ["crm overview"],
  },
  {
    prefix: "/app/flows",
    docSlugs: ["automation-flows"],
    docKeywords: ["automation flows", "automation overview"],
    sectionIds: ["automation-overview"],
    sectionKeywords: ["automation overview"],
  },
  {
    prefix: "/app/automation",
    docSlugs: ["automation-flows"],
    docKeywords: ["automation flows", "supported nodes"],
    sectionIds: ["supported-nodes"],
    sectionKeywords: ["supported nodes"],
  },
  {
    prefix: "/app/wallet",
    docSlugs: ["wallet-and-billing"],
    docKeywords: ["wallet and billing", "wallet overview"],
    sectionIds: ["wallet-overview"],
    sectionKeywords: ["wallet overview"],
  },
  {
    prefix: "/app/plan",
    docSlugs: ["plans-paid-features-and-upgrade-flow"],
    docKeywords: ["plans paid features", "paid features", "upgrade flow"],
    sectionIds: ["paid-features"],
    sectionKeywords: ["paid features"],
  },
  {
    prefix: "/app/links",
    docSlugs: ["reports-and-analytics"],
    docKeywords: ["reports and analytics", "tracked links"],
    sectionIds: ["reports-overview"],
    sectionKeywords: ["reports overview", "tracked links"],
  },
  {
    prefix: "/app/activity",
    docSlugs: ["reports-and-analytics"],
    docKeywords: ["reports and analytics", "activity logs"],
    sectionIds: ["reports-overview"],
    sectionKeywords: ["reports overview", "activity logs"],
  },
  {
    prefix: "/app/api-keys",
    docSlugs: ["external-chat-api-integration", "external-chat-api-access"],
    docKeywords: ["external chat api", "api keys", "api integration"],
    sectionIds: ["base-path"],
    sectionKeywords: ["base path", "authentication"],
  },
  {
    prefix: "/app/api-reports",
    docSlugs: ["external-chat-api-integration", "reports-and-analytics"],
    docKeywords: ["external chat api", "message status updates", "reports and analytics"],
    sectionIds: ["message-status-updates"],
    sectionKeywords: ["message status updates"],
  },
  {
    prefix: "/app",
    docSlugs: ["get-started"],
    docKeywords: ["get started", "recommended setup checklist"],
    sectionIds: ["get-started-with-ai-wiz-chat"],
    sectionKeywords: ["get started"],
  },
];

function normalizeComparable(value: string | undefined) {
  return String(value || "").trim().toLowerCase();
}

function includesAny(value: string, keywords: string[] | undefined) {
  const normalized = normalizeComparable(value);
  return (keywords || []).some((keyword) => normalized.includes(normalizeComparable(keyword)));
}

export function resolveDocsUrlForPath(pathname: string, docs: DocsLinkItem[]) {
  const currentPath = pathname || "/app";
  const rule = PAGE_DOC_RULES.find((item) => (
    item.prefix === "/app" ? currentPath === "/app" : currentPath.startsWith(item.prefix)
  ));
  if (!rule || !Array.isArray(docs) || !docs.length) return null;

  const doc = docs.find((item) => (rule.docSlugs || []).includes(normalizeComparable(item.slug)))
    || docs.find((item) => includesAny(`${item.slug || ""} ${item.title || ""} ${item.description || ""} ${item.category || ""}`, rule.docKeywords));

  if (!doc?.slug) return null;

  const sections = Array.isArray(doc.sections) ? doc.sections : [];
  const section = sections.find((item) => (rule.sectionIds || []).includes(normalizeComparable(item.id)))
    || sections.find((item) => includesAny(`${item.id || ""} ${item.title || ""}`, rule.sectionKeywords));

  const hash = section?.id ? `#${section.id}` : "";
  return `${DOCS_BASE_URL}/${String(doc.slug).replace(/^\/+/, "")}${hash}`;
}

export function getShellTitle(pathname: string, items: typeof NAV_ITEMS) {
  const active = items.find((item) => item.to === "/app" ? pathname === item.to : pathname.startsWith(item.to));
  return active?.label || "Workspace";
}

export function routeTransitionKey(pathname: string) {
  if (pathname.startsWith("/app/conversations")) return "/app/conversations";
  return pathname;
}
