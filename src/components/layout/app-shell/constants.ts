import { Bot, BriefcaseBusiness, CreditCard, FileSearch, FileText, History, Key, LayoutDashboard, Link2, ListFilter, MessageSquare, Send, Terminal, Users, Wallet, Workflow, Zap, Layers3 } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/app", label: "Dashboard", kicker: "overview", icon: LayoutDashboard, pageKey: "dashboard" },
  { to: "/app/meta", label: "WhatsApp Setup", kicker: "credentials", icon: Key, pageKey: "whatsapp-setup" },
  { to: "/app/templates", label: "Templates", kicker: "library", icon: FileText, pageKey: "templates" },
  { to: "/app/send", label: "Campaigns", kicker: "broadcast", icon: Send, pageKey: "campaigns" },
  { to: "/app/contacts", label: "Contacts", kicker: "audience", icon: Users, pageKey: "contacts" },
  { to: "/app/audiences", label: "Audiences", kicker: "segments", icon: Layers3, pageKey: "audiences" },
  { to: "/app/attributes", label: "Attributes", kicker: "contact data", icon: ListFilter, pageKey: "attributes" },
  { to: "/app/conversations", label: "Inbox", kicker: "chatroom", icon: MessageSquare, pageKey: "inbox" },
  { to: "/app/crm", label: "CRM", kicker: "leads", icon: BriefcaseBusiness, pageKey: "crm" },
  { to: "/app/flows", label: "Flows", kicker: "forms", icon: Workflow, pageKey: "automation" },
  { to: "/app/wallet", label: "Wallet", kicker: "credits", icon: Wallet, pageKey: "wallet" },
  { to: "/app/plan", label: "Plans & Billing", kicker: "subscription", icon: CreditCard, pageKey: "plans" },
  { to: "/app/links", label: "Tracked links", kicker: "analytics", icon: Link2, pageKey: "tracked-links" },
  { to: "/app/automation", label: "Automation", kicker: "chat flows", icon: Zap, pageKey: "automation" },
  { to: "/app/ai-agents", label: "AI Agents", kicker: "assistants", icon: Bot, pageKey: "ai-agents" },
  { to: "/app/activity", label: "Activity", kicker: "audit logs", icon: History, pageKey: "activity" },
  { to: "/app/api-keys", label: "API Keys", kicker: "developer", icon: Terminal, pageKey: "external-chat-api" },
  { to: "/app/api-reports", label: "API Report", kicker: "api logs", icon: FileSearch, pageKey: "api-reports" },
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
  pageKey?: string;
  targetSectionId?: string;
  slug?: string;
  title?: string;
  description?: string;
  category?: string;
  sections?: DocsSection[];
};

function normalizeComparable(value: string | undefined) {
  return String(value || "").trim().toLowerCase();
}

export function getAppPageKeyForPath(pathname: string) {
  const currentPath = pathname || "/app";
  const active = NAV_ITEMS.find((item) => (
    item.to === "/app" ? currentPath === item.to : currentPath.startsWith(item.to)
  ));
  return active?.pageKey || "";
}

export function resolveDocsUrlForPath(pathname: string, docs: DocsLinkItem[]) {
  const appPageKey = getAppPageKeyForPath(pathname);
  if (!appPageKey || !Array.isArray(docs) || !docs.length) return null;

  const doc = docs.find((item) => normalizeComparable(item.pageKey) === appPageKey);
  if (!doc?.slug) return null;

  const sections = Array.isArray(doc.sections) ? doc.sections : [];
  const targetSectionId = normalizeComparable(doc.targetSectionId);
  const section = targetSectionId
    ? sections.find((item) => normalizeComparable(item.id) === targetSectionId)
    : null;

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
