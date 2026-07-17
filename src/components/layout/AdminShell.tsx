import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Bell,
  Briefcase,
  CreditCard,
  FileText,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Menu,
  MessageSquareText,
  PanelLeftOpen,
  Shield,
  Ticket,
  Users,
  User,
  Wallet,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { BRAND_NAME } from "@shared/config/brand";
import { API } from "@api/api";
import { Button } from "@components/ui/Button";
import { cn } from "@shared/utils/cn";
import { useAuth } from "@shared/providers/AuthContext";

const SIDEBAR_WIDTH_OPEN = 260;
const SIDEBAR_WIDTH_COLLAPSED = 80;
const SIDEBAR_SPRING = { type: "spring", damping: 26, stiffness: 260, mass: 0.9 } as const;

export type AdminShellNavItem = {
  to: string;
  label: string;
  kicker: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: AdminShellNavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", kicker: "overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", kicker: "accounts", icon: Users },
  { to: "/admin/workspaces", label: "Workspaces", kicker: "whatsapp", icon: Shield },
  { to: "/admin/master-campaigns", label: "Master Campaigns", kicker: "broadcasts", icon: Megaphone },
  { to: "/admin/master-templates", label: "Master Templates", kicker: "library", icon: FileText },
  { to: "/admin/master-contacts", label: "Master Contacts", kicker: "segments", icon: ListChecks },
  { to: "/admin/analytics", label: "Analytics", kicker: "insights", icon: BarChart3 },
  { to: "/admin/notifications", label: "Notifications", kicker: "alerts", icon: Bell },
  { to: "/admin/subscriptions-data", label: "Subscriptions Data", kicker: "plans", icon: Wallet },
  { to: "/admin/transactions-logs", label: "Transactions Logs", kicker: "payments", icon: CreditCard },
  { to: "/admin/message-logs", label: "Message Logs", kicker: "delivery", icon: MessageSquareText },
  { to: "/admin/pages", label: "Pages", kicker: "cms", icon: FileText },
  { to: "/admin/docs", label: "Docs", kicker: "knowledge", icon: FileText },
  { to: "/admin/support-tickets", label: "Support Tickets", kicker: "helpdesk", icon: Ticket },
  { to: "/admin/career-applications", label: "Careers", kicker: "hiring", icon: Briefcase },
  { to: "/admin/profile", label: "Profile", kicker: "account", icon: User },
];

function SideLink({ item, isCollapsed }: { item: AdminShellNavItem; isCollapsed: boolean }) {
  const { icon: Icon, label, kicker, to } = item;
  return (
    <NavLink
      to={to}
      title={isCollapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          "group relative flex cursor-pointer items-center rounded-r-[5px] transition-all duration-200 ease-in-out",
          isCollapsed ? "justify-center p-3" : "px-4 py-3 gap-3",
          isActive
            ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn("flex-shrink-0 transition-transform group-hover:scale-110", isCollapsed ? "size-6" : "size-5")} />
          {!isCollapsed ? (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold tracking-tight">{label}</div>
              <div className="truncate text-[9px] font-black uppercase tracking-widest opacity-60">{kicker}</div>
            </div>
          ) : null}
          {!isCollapsed && !isActive && (
            <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
          )}
          {isActive ? (
            <motion.div layoutId="admin-active-nav" className="absolute -left-1 h-6 w-1.5 rounded-r-[5px] bg-white" />
          ) : null}
        </>
      )}
    </NavLink>
  );
}

export function AdminShell({
  children,
  navItems = NAV_ITEMS,
  storageKey = "aiwizchat_admin_sidebar_collapsed",
  brandSuffix = " Admin",
}: {
  children: React.ReactNode;
  navItems?: AdminShellNavItem[];
  storageKey?: string;
  brandSuffix?: string;
}) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [runtimeBrandName, setRuntimeBrandName] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, isCollapsed ? "1" : "0");
    } catch {}
  }, [isCollapsed, storageKey]);

  useEffect(() => {
    let mounted = true;
    API.admin
      .platformBrandGet()
      .then((res: any) => {
        if (!mounted) return;
        setRuntimeBrandName(String(res?.settings?.brandName || "").trim());
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const resolvedBrandName = runtimeBrandName || BRAND_NAME;

  const visibleNavItems = React.useMemo(() => {
    if (String(user?.role || "") !== "admin") return navItems;
    const allowedPages = new Set(Array.isArray(user?.permissions?.pages) ? user.permissions.pages : []);
    allowedPages.add("/admin/dashboard");
    allowedPages.add("/admin/profile");
    return navItems.filter((item) => allowedPages.has(item.to));
  }, [navItems, user]);

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] font-sans text-slate-900 antialiased overflow-x-hidden">
      {/* Background Polish */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(6,183,126,0.05),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,rgba(6,183,126,0.03),transparent_50%)]" />
        <div className="absolute inset-0 bg-grid opacity-[0.03]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1700px] lg:p-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 mb-4 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileNavOpen(true)} className="rounded-[5px] border border-slate-200 bg-white p-2 text-slate-600">
              <Menu size={20} />
            </button>
            <span className="text-lg font-black tracking-tighter text-brand-600">{resolvedBrandName}{brandSuffix}</span>
          </div>
          <button onClick={logout} className="rounded-[5px] border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
            <LogOut size={18} className="inline mr-2" />
            Logout
          </button>
        </header>

        <AnimatePresence>
          {mobileNavOpen ? (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm lg:hidden" />
              <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 z-[70] w-[300px] lg:hidden">
                <div className="flex h-full flex-col overflow-hidden bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 p-6">
                    <span className="text-2xl font-black tracking-tighter text-brand-600">{resolvedBrandName}{brandSuffix}</span>
                    <button onClick={() => setMobileNavOpen(false)} className="rounded-[5px] p-2 hover:bg-slate-100 text-slate-400">
                      <X size={24} />
                    </button>
                  </div>
                  <nav className="flex-1 space-y-1 overflow-y-auto p-4 custom-scrollbar">
                    {visibleNavItems.map((item) => <SideLink key={item.to} item={item} isCollapsed={false} />)}
                  </nav>
                  <div className="border-t border-slate-100 p-4">
                    <Button variant="danger" className="w-full justify-start gap-3 h-12 font-bold" onClick={logout}>
                      <LogOut size={18} /> Logout
                    </Button>
                  </div>
                </div>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>

        <div className="flex min-h-[100vh] gap-6">
          {/* Desktop Sidebar (fixed) */}
          <motion.div
            aria-hidden
            className="hidden lg:block flex-none"
            animate={{ width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_OPEN }}
            transition={SIDEBAR_SPRING}
          />
          <motion.aside
            animate={{ width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_OPEN }}
            transition={SIDEBAR_SPRING}
            className="fixed top-0 bottom-0 left-0 z-50 hidden h-[100vh] flex-col overflow-hidden rounded-[5px] border border-slate-200 bg-white shadow-sm lg:flex"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <AnimatePresence initial={false} mode="wait">
                {!isCollapsed ? (
                  <motion.span
                    key="brand"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="text-2xl font-black tracking-tighter text-brand-600"
                  >
                    {resolvedBrandName}{brandSuffix}
                  </motion.span>
                ) : (
                  <motion.div
                    key="brand-spacer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-8 w-8"
                  />
                )}
              </AnimatePresence>
              <button onClick={() => setIsCollapsed((prev) => !prev)} className="rounded-[5px] p-2 hover:bg-slate-50 text-slate-400 hover:text-brand-600 transition-colors">
                <PanelLeftOpen size={22} className={cn("transition-transform duration-300", isCollapsed && "rotate-180")} />
              </button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto p-4 custom-scrollbar">
              {visibleNavItems.map((item) => <SideLink key={item.to} item={item} isCollapsed={isCollapsed} />)}
            </div>
            <div className="border-t border-slate-100 p-4">
              <Button 
                variant="danger" 
                className={cn("transition-all duration-300", isCollapsed ? "w-full justify-center px-0 h-12" : "w-full gap-3 h-12 font-bold justify-start")} 
                onClick={logout}
              >
                <LogOut size={18} /> 
                {!isCollapsed && "Logout"}
              </Button>
            </div>
          </motion.aside>

          {/* Main Content */}
          <main className="min-w-0 flex-1 relative">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
