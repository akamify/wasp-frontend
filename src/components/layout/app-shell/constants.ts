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

const PAGE_DOC_LINKS = [
  { prefix: "/app/meta", path: "/whatsapp-business-account-connect" },
  { prefix: "/app/templates", path: "/template-creation-approval" },
  { prefix: "/app/send", path: "/campaigns#create-campaign" },
  { prefix: "/app/contacts", path: "/contacts#import-contacts" },
  { prefix: "/app/audiences", path: "/contacts#audiences" },
  { prefix: "/app/attributes", path: "/contacts#contact-attributes" },
  { prefix: "/app/conversations", path: "/external-chat-api-integration#realtime-stream" },
  { prefix: "/app/crm", path: "/crm-access" },
  { prefix: "/app/flows", path: "/automation-flow-builder" },
  { prefix: "/app/automation", path: "/automation-flow-builder" },
  { prefix: "/app/wallet", path: "/wallet-and-billing" },
  { prefix: "/app/plan", path: "/plans-and-billing" },
  { prefix: "/app/links", path: "/tracked-links" },
  { prefix: "/app/ai-agents", path: "/ai-agents" },
  { prefix: "/app/activity", path: "/activity-logs" },
  { prefix: "/app/api-keys", path: "/external-chat-api-integration#base-path" },
  { prefix: "/app/api-reports", path: "/external-chat-api-integration#rate-limits" },
  { prefix: "/app", path: "/getting-started" },
];

export function getDocsUrlForPath(pathname: string) {
  const currentPath = pathname || "/app";
  const match = PAGE_DOC_LINKS.find((item) => (
    item.prefix === "/app" ? currentPath === "/app" : currentPath.startsWith(item.prefix)
  ));
  const docsPath = match?.path || "/getting-started";
  return `${DOCS_BASE_URL}${docsPath.startsWith("/") ? docsPath : `/${docsPath}`}`;
}

export function getShellTitle(pathname: string, items: typeof NAV_ITEMS) {
  const active = items.find((item) => item.to === "/app" ? pathname === item.to : pathname.startsWith(item.to));
  return active?.label || "Workspace";
}

export function routeTransitionKey(pathname: string) {
  if (pathname.startsWith("/app/conversations")) return "/app/conversations";
  return pathname;
}
