import type { ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Boxes,
  Briefcase,
  CreditCard,
  FileText,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  MessageSquareText,
  Shield,
  Ticket,
  UserCircle2,
  Users,
  Wallet,
} from "lucide-react";
import { AdminShell, type AdminShellNavItem } from "@components/layout/AdminShell";

const SUPER_ADMIN_NAV_ITEMS: AdminShellNavItem[] = [
  { to: "/super-admin/dashboard", label: "Dashboard", kicker: "overview", icon: LayoutDashboard },
  { to: "/super-admin/users", label: "Users", kicker: "accounts", icon: Users },
  { to: "/super-admin/workspaces", label: "Workspaces", kicker: "whatsapp", icon: Shield },
  { to: "/super-admin/master-campaigns", label: "Master Campaigns", kicker: "broadcasts", icon: Megaphone },
  { to: "/super-admin/master-templates", label: "Master Templates", kicker: "library", icon: FileText },
  { to: "/super-admin/master-contacts", label: "Master Contacts", kicker: "segments", icon: ListChecks },
  { to: "/super-admin/analytics", label: "Analytics", kicker: "insights", icon: BarChart3 },
  { to: "/super-admin/notifications", label: "Notifications", kicker: "alerts", icon: Bell },
  { to: "/super-admin/subscription-plans", label: "Subscription Plans", kicker: "pricing", icon: Boxes },
  { to: "/super-admin/subscriptions-data", label: "Subscriptions Data", kicker: "users", icon: Wallet },
  { to: "/super-admin/transactions-logs", label: "Transactions Logs", kicker: "payments", icon: CreditCard },
  { to: "/super-admin/message-logs", label: "Message Logs", kicker: "delivery", icon: MessageSquareText },
  { to: "/super-admin/pages", label: "Pages", kicker: "cms", icon: FileText },
  { to: "/super-admin/support-tickets", label: "Support Tickets", kicker: "helpdesk", icon: Ticket },
  { to: "/super-admin/career-applications", label: "Careers", kicker: "hiring", icon: Briefcase },
  { to: "/super-admin/admins", label: "Admin Management", kicker: "rbac", icon: Users },
  { to: "/super-admin/docs", label: "Docs", kicker: "knowledge", icon: FileText },
  { to: "/super-admin/platform-settings", label: "Platform Settings", kicker: "global config", icon: Shield },
  { to: "/super-admin/profile", label: "Profile", kicker: "root account", icon: UserCircle2 },
];

export function SuperAdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminShell
      navItems={SUPER_ADMIN_NAV_ITEMS}
      storageKey="waspakamify_super_admin_sidebar_collapsed"
      brandSuffix=" Root"
    >
      {children}
    </AdminShell>
  );
}
