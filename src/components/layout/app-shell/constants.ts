import { BriefcaseBusiness, FileSearch, FileText, History, Key, LayoutDashboard, Link2, MessageSquare, Send, Terminal, Users, Wallet, Workflow, Zap } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/app", label: "Dashboard", kicker: "overview", icon: LayoutDashboard },
  { to: "/app/meta", label: "WhatsApp Setup", kicker: "credentials", icon: Key },
  { to: "/app/templates", label: "Templates", kicker: "library", icon: FileText },
  { to: "/app/send", label: "Campaigns", kicker: "broadcast", icon: Send },
  { to: "/app/contacts", label: "Contacts", kicker: "audience", icon: Users },
  { to: "/app/conversations", label: "Inbox", kicker: "chatroom", icon: MessageSquare },
  { to: "/app/crm", label: "CRM", kicker: "leads", icon: BriefcaseBusiness },
  { to: "/app/flows", label: "Flows", kicker: "forms", icon: Workflow },
  { to: "/app/wallet", label: "Wallet", kicker: "credits", icon: Wallet },
  { to: "/app/links", label: "Tracked links", kicker: "analytics", icon: Link2 },
  { to: "/app/automation", label: "Automation", kicker: "events", icon: Zap },
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

export function getShellTitle(pathname: string, items: typeof NAV_ITEMS) {
  const active = items.find((item) => item.to === "/app" ? pathname === item.to : pathname.startsWith(item.to));
  return active?.label || "Workspace";
}

export function routeTransitionKey(pathname: string) {
  if (pathname.startsWith("/app/conversations")) return "/app/conversations";
  return pathname;
}
