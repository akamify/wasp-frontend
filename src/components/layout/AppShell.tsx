import React, { useEffect, useState, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@shared/utils/cn";
import { useAuth } from "@shared/providers/AuthContext";
import { BRAND_NAME } from "@shared/config/brand";
import { API } from "@api/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Key, FileText, Send, Users,
  MessageSquare, Link2, Zap, PanelLeftClose,
  PanelLeftOpen, Menu, Wallet, Workflow,
  Bell, Globe, History, Terminal, CheckCircle2, AlertCircle, MessageCircle,
  X, MoreHorizontal, ChevronRight, FileSearch, Settings, CreditCard, LogOut,
  User,
  BriefcaseBusiness
} from "lucide-react";
import { WorkspaceStatusBar } from "@components/layout/WorkspaceStatusBar";

type RequiredPlan = "basic" | "pro";
type RequiredFeatureKey =
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
  | "activityPageAccess"
  | "apiKeysPageAccess"
  | "apiReportsPageAccess";

const NAV_ITEMS = [
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

function SideLink({ to, label, kicker, icon: Icon, isCollapsed }: any) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== "/app" && location.pathname.startsWith(to));

  return (
    <NavLink
      to={to}
      end={to === "/app"}
      title={isCollapsed ? label : undefined}
      className={({ isActive: linkActive }) =>
        cn(
          "group relative flex cursor-pointer items-center rounded-[5px] transition-all duration-200 ease-in-out",
          isCollapsed ? "justify-center p-3" : "px-4 py-2.5 gap-3",
          linkActive
            ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
            : "text-ink-900/60 hover:bg-ink-900/5 hover:text-ink-900"
        )
      }
    >
      <Icon className={cn("flex-shrink-0 transition-transform group-hover:scale-110", isCollapsed ? "size-6" : "size-5")} />
      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{label}</div>
          <div className={cn("text-[10px] uppercase tracking-wider opacity-60 truncate font-medium", isCollapsed ? "hidden" : "block")}>
            {kicker}
          </div>
        </div>
      )}
      {/* Active Indicator Dot */}
      {isActive && (
        <motion.div
          layoutId="active-nav"
          className="absolute -left-1 w-1.5 h-6 bg-white rounded-r-[5px]"
        />
      )}
    </NavLink>
  );
}

function getShellTitle(pathname: string, items: typeof NAV_ITEMS) {
  const active = items.find((item) => item.to === "/app" ? pathname === item.to : pathname.startsWith(item.to));
  return active?.label || "Workspace";
}

function routeTransitionKey(pathname: string) {
  // Avoid full page remount when switching chats; only the chat content should update.
  if (pathname.startsWith("/app/conversations")) return "/app/conversations";
  return pathname;
}

/* ─── Mobile Bottom Tabs ─────────────────────────────────────────── */
const MOBILE_TABS = [
  { to: "/app", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/app/send", label: "Campaigns", icon: Send, end: false },
  { to: "/app/conversations", label: "Inbox", icon: MessageSquare, end: false },
  { to: "/app/contacts", label: "Contacts", icon: Users, end: false },
];



function MobileBottomTabs() {
  const location = useLocation();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[200] bg-white/95 backdrop-blur-xl border-t border-slate-200 safe-area-bottom">
      <div className="flex items-stretch justify-around h-[60px]">
        {MOBILE_TABS.map((tab) => {
          const isActive = tab.end
            ? location.pathname === tab.to
            : location.pathname.startsWith(tab.to);
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className="flex flex-col items-center justify-center flex-1 gap-0.5 relative transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-brand-600 rounded-b-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                size={20}
                className={cn(
                  "transition-colors",
                  isActive ? "text-brand-600" : "text-slate-400"
                )}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none tracking-tight",
                  isActive ? "text-brand-600 font-bold" : "text-slate-400"
                )}
              >
                {tab.label}
              </span>
            </NavLink>
          );
        })}
        {/* More tab — triggers drawer via custom event */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-mobile-drawer"))}
          className="flex flex-col items-center justify-center flex-1 gap-0.5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <MoreHorizontal size={20} strokeWidth={1.8} />
          <span className="text-[10px] font-semibold leading-none tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
}

/* ─── Mobile Top Bar ─────────────────────────────────────────────── */
function MobileTopBar({
  onMenuOpen,
  workspaceName,
  brandName,
  notifications,
  lastReadAt,
  markAllRead,
  navigate,
}: {
  onMenuOpen: () => void;
  workspaceName?: string;
  brandName: string;
  notifications: any[];
  lastReadAt: number;
  markAllRead: () => void;
  navigate: (to: string) => void;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-[200] h-14 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between px-3">
      <button onClick={onMenuOpen} className="p-2 hover:bg-slate-100 rounded-[5px] active:scale-95 transition-all">
        <Menu size={22} className="text-slate-700" />
      </button>
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-black text-brand-600 uppercase tracking-tighter leading-none">{brandName}</span>
        <span className="text-xs font-bold truncate max-w-[140px] text-slate-800">{workspaceName || "Workspace"}</span>
      </div>
      <div className="flex items-center gap-1">
        {/* <button
          onClick={() => { navigate("/app/settings"); }}
          className="p-2 border-t border-slate-100 shrink-0 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-[5px] bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs shrink-0 uppercase shadow-sm">
              {user?.name?.[0] || user?.email?.[0] || "?"}
            </div>
          </div>
        </button> */}
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={cn(
              "p-2 rounded-[5px] relative transition-all active:scale-95",
              notifOpen ? "bg-brand-50 text-brand-600" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            <Bell size={20} />
            {notifications.some((n: any) => !lastReadAt || Number(n?._eventTime || 0) > lastReadAt) ? (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            ) : null}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-1 mt-2 w-86 bg-white rounded-[5px] shadow-2xl border border-slate-100 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Notifications</h3>
                  <button onClick={markAllRead} className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline">Read all</button>
                </div>
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { navigate(n.link); setNotifOpen(false); }}
                      className="w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group"
                    >
                      <div className="flex gap-4">
                        <div className={cn("mt-1 w-8 h-8 rounded-[5px] flex items-center justify-center shrink-0", n.bg, n.color)}>
                          {n.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm font-black text-slate-900">{n.title}</span>
                            <span className="text-[10px] font-bold text-slate-400">{n.time}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{n.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {notifications.length === 0 ? (
                    <div className="px-5 py-6 text-center text-xs font-semibold text-slate-400">
                      No recent activity
                    </div>
                  ) : null}
                </div>
                <button
                  onClick={() => { navigate("/app/activity"); setNotifOpen(false); }}
                  className="w-full py-3 text-center bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-600 transition-colors"
                >
                  View All Activity
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

/* ─── Mobile Drawer ──────────────────────────────────────────────── */
function MobileDrawer({
  open,
  onClose,
  user,
  workspace,
  brandName,
  navigate,
}: {
  open: boolean;
  onClose: () => void;
  user: any;
  workspace: any;
  brandName: string;
  navigate: (to: string) => void;
}) {
  const location = useLocation();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="lg:hidden fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm"
          />
          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="lg:hidden fixed top-0 left-0 bottom-0 z-[301] w-[280px] bg-white flex flex-col shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-brand-600 rounded-[5px] flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-brand-500/20">W</div>
                <span className="font-black text-base tracking-tighter text-slate-900">{brandName}</span>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-[5px] text-slate-400 active:scale-95 transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Drawer Nav Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-3 px-3">
              {NAV_ITEMS.map((item) => {
                const isActive = item.to === "/app"
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/app"}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-[5px] transition-all mb-0.5",
                      isActive
                        ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
                        : "text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                    )}
                  >
                    <item.icon size={18} className="shrink-0" strokeWidth={isActive ? 2.5 : 1.8} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{item.label}</div>
                      <div className={cn("text-[9px] uppercase tracking-wider font-medium", isActive ? "text-white/60" : "text-slate-400")}>
                        {item.kicker}
                      </div>
                    </div>
                    {isActive && <ChevronRight size={14} className="text-white/60" />}
                  </NavLink>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <button
              onClick={() => navigate("/app/profile")}
              className="p-4 border-t border-slate-100 shrink-0 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3 px-1">
                <div className="w-9 h-9 rounded-[5px] bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs shrink-0 uppercase shadow-sm">
                  {user?.name?.[0] || user?.email?.[0] || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate text-slate-900">{user?.name || "User"}</p>
                  <p className="text-[10px] font-semibold text-slate-400 truncate uppercase tracking-tighter">{workspace?.plan || "Free"} Plan</p>
                </div>
              </div>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, workspace, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [runtimeBrandName, setRuntimeBrandName] = useState("");
  const resolvedBrandName = runtimeBrandName || BRAND_NAME;
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const hideMobileBarsOnChatDetail =
    location.pathname.startsWith("/app/conversations/") &&
    location.pathname !== "/app/conversations" &&
    location.pathname !== "/app/conversations/";

  // Listen for "More" tab event from the bottom bar
  useEffect(() => {
    const handler = () => setMobileDrawerOpen(true);
    window.addEventListener("open-mobile-drawer", handler);
    return () => window.removeEventListener("open-mobile-drawer", handler);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    let mounted = true;
    API.public
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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("waspakamify_sidebar_collapsed_touched") === "1"
        ? localStorage.getItem("waspakamify_sidebar_collapsed") === "1"
        : false;
    } catch {
      return false;
    }
  });


  useEffect(() => {
    try {
      localStorage.setItem("waspakamify_sidebar_collapsed", isCollapsed ? "1" : "0");
    } catch { }
  }, [isCollapsed]);

  function toggleSidebarCollapsed() {
    setIsCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem("waspakamify_sidebar_collapsed_touched", "1");
        localStorage.setItem("waspakamify_sidebar_collapsed", next ? "1" : "0");
      } catch { }
      return next;
    });
  }

  const desktopNavRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const sidebarProfileMenuRef = useRef<HTMLDivElement | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarProfileMenuOpen, setSidebarProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: number;
    title: string;
    desc: string;
    time: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    link: string;
  }>>([]);
  const [lastReadAt, setLastReadAt] = useState<number>(0);
  const [billingCurrent, setBillingCurrent] = useState<any>(null);
  const [billingLoading, setBillingLoading] = useState<boolean>(true);



  const markAllRead = () => {
    setLastReadAt(Date.now());
  };

  useEffect(() => {
    let alive = true;
    const loadBillingCurrent = async () => {
      try {
        const res = await API.billing.current();
        if (!alive) return;
        setBillingCurrent(res || null);
      } catch {
        if (!alive) return;
        setBillingCurrent(null);
      } finally {
        if (alive) setBillingLoading(false);
      }
    };

    void loadBillingCurrent();
    const timer = window.setInterval(() => {
      void loadBillingCurrent();
    }, 30000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  function requiredPlanForPath(pathname: string): RequiredPlan | null {
    // Always allowed without paid plan
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
    ) {
      return null;
    }
    // Pro-only routes
    if (
      pathname.startsWith("/app/crm") ||
      pathname.startsWith("/app/automation") ||
      pathname.startsWith("/app/api-reports")
    ) {
      return "pro";
    }
    // Any other authenticated app route requires at least Basic
    if (pathname.startsWith("/app")) return "basic";
    return null;
  }

  function requiredFeatureForPath(pathname: string): RequiredFeatureKey | null {
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
    if (pathname.startsWith("/app/activity")) return "activityPageAccess";
    if (pathname.startsWith("/app/api-keys")) return "apiKeysPageAccess";
    if (pathname.startsWith("/app/api-reports")) return "apiReportsPageAccess";
    return null;
  }

  const requiredPlan = requiredPlanForPath(location.pathname);
  const currentFeatures = billingCurrent?.effective?.features || {};
  const hasActiveSubscription = Boolean(billingCurrent?.subscription?.id);
  const hasBasicAccess = true;
  const hasProAccess = Boolean(
    currentFeatures?.crmAccess ||
    currentFeatures?.externalChatApiAccess ||
    currentFeatures?.automationAccess
  );
  const isBlockedByPlan =
    !billingLoading &&
    requiredPlan !== null &&
    ((requiredPlan === "basic" && !hasBasicAccess) || (requiredPlan === "pro" && !hasProAccess));
  const requiredFeature = requiredFeatureForPath(location.pathname);
  const proFeatureKeys: RequiredFeatureKey[] = [
    "crmPageAccess",
    "flowsPageAccess",
    "linksPageAccess",
    "automationPageAccess",
    "activityPageAccess",
    "apiKeysPageAccess",
    "apiReportsPageAccess",
  ];
  const featureNeedsPro = requiredFeature ? proFeatureKeys.includes(requiredFeature) : false;
  const planRestrictionEnabled = billingCurrent?.enforcement?.planRestrictionsEnabled === true;
  const hasFeaturePageAccess =
    requiredFeature == null
      ? true
      : Boolean(currentFeatures?.[requiredFeature]);
  const isBlockedByFeature =
    !billingLoading &&
    requiredFeature !== null &&
    !hasFeaturePageAccess;
  const isPlanAccessBlocked = planRestrictionEnabled && (isBlockedByPlan || isBlockedByFeature);
  const isAccessCheckPending =
    planRestrictionEnabled &&
    billingLoading &&
    (requiredPlan !== null || requiredFeature !== null);

  const relativeTime = (value?: string | null) => {
    if (!value) return "just now";
    const t = new Date(value).getTime();
    if (!Number.isFinite(t)) return "just now";
    const diff = Date.now() - t;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))} min ago`;
    if (diff < 86400000) return `${Math.max(1, Math.floor(diff / 3600000))} hr ago`;
    return `${Math.max(1, Math.floor(diff / 86400000))} day ago`;
  };

  useEffect(() => {
    let alive = true;
    const loadNotifications = async () => {
      try {
        const [conversationsRes, logsRes, walletRes] = await Promise.allSettled([
          API.conversations.list({ limit: 25 }),
          API.messages.logs({ page: 1, limit: 25 }),
          API.wallet.get(),
        ]);
        if (!alive) return;

        const conversations =
          conversationsRes.status === "fulfilled" && Array.isArray(conversationsRes.value?.conversations)
            ? conversationsRes.value.conversations
            : [];
        const logs =
          logsRes.status === "fulfilled" && Array.isArray(logsRes.value?.items)
            ? logsRes.value.items
            : [];
        const wallet = walletRes.status === "fulfilled" ? walletRes.value?.wallet : null;

        const unreadCount = conversations.reduce(
          (total: number, item: any) => total + Number(item?.unreadCount || 0),
          0
        );
        const latestConversation = conversations[0] || null;
        const latestLog = logs[0] || null;
        const latestFailed = logs.find((item: any) => String(item?.status || "").toLowerCase() === "failed") || null;

        const nextNotifications: any[] = [];
        if (unreadCount > 0) {
          const phone = latestConversation?.phone ? String(latestConversation.phone) : "";
          const eventTime = latestConversation?.lastMessageAt ? new Date(latestConversation.lastMessageAt).getTime() : Date.now();
          nextNotifications.push({
            id: 1,
            title: "Inbox Activity",
            desc: `${unreadCount} unread message${unreadCount > 1 ? "s" : ""} in conversations.`,
            time: latestConversation?.lastMessageAt ? relativeTime(latestConversation.lastMessageAt) : "just now",
            icon: <MessageCircle size={16} />,
            color: "text-brand-600",
            bg: "bg-brand-50",
            link: phone ? `/app/conversations/${phone}` : "/app/conversations",
            _eventTime: eventTime,
          });
        }

        if (latestConversation) {
          const contactName = latestConversation?.contact?.name || latestConversation?.phone || "contact";
          const phone = latestConversation?.phone ? String(latestConversation.phone) : "";
          const eventTime = latestConversation?.lastMessageAt ? new Date(latestConversation.lastMessageAt).getTime() : Date.now();
          nextNotifications.push({
            id: 2,
            title: "Latest Conversation",
            desc: `Recent chat update from ${contactName}.`,
            time: latestConversation?.lastMessageAt ? relativeTime(latestConversation.lastMessageAt) : "just now",
            icon: <CheckCircle2 size={16} />,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
            link: phone ? `/app/conversations/${phone}` : "/app/conversations",
            _eventTime: eventTime,
          });
        }

        if (latestLog) {
          const status = String(latestLog?.status || "sent").toLowerCase();
          const phone = latestLog?.phone || latestLog?.to || "recipient";
          const eventTime = latestLog?.createdAt ? new Date(latestLog.createdAt).getTime() : Date.now();
          nextNotifications.push({
            id: 5,
            title: status === "failed" ? "Latest Delivery Failed" : "Latest Message Update",
            desc: `Message to ${phone} is ${status}.`,
            time: latestLog?.createdAt ? relativeTime(latestLog.createdAt) : "just now",
            icon: status === "failed" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />,
            color: status === "failed" ? "text-rose-500" : "text-blue-500",
            bg: status === "failed" ? "bg-rose-50" : "bg-blue-50",
            link: `/app/activity?status=${encodeURIComponent(status)}&search=${encodeURIComponent(phone)}`,
            _eventTime: eventTime,
          });
        }

        if (latestFailed) {
          const eventTime = latestFailed?.createdAt ? new Date(latestFailed.createdAt).getTime() : Date.now();
          nextNotifications.push({
            id: 3,
            title: "Delivery Issue",
            desc: `A message to ${latestFailed?.phone || latestFailed?.to || "recipient"} failed.`,
            time: latestFailed?.createdAt ? relativeTime(latestFailed.createdAt) : "just now",
            icon: <AlertCircle size={16} />,
            color: "text-rose-500",
            bg: "bg-rose-50",
            link: `/app/activity?status=failed&search=${encodeURIComponent(latestFailed?.phone || latestFailed?.to || "")}`,
            _eventTime: eventTime,
          });
        }

        if ((wallet?.balance ?? 0) < 100) {
          nextNotifications.push({
            id: 4,
            title: "Wallet Low",
            desc: "Your balance is below Rs.100. Recharge now to avoid interruption.",
            time: "now",
            icon: <AlertCircle size={16} />,
            color: "text-amber-500",
            bg: "bg-amber-50",
            link: "/app/wallet",
            _eventTime: Date.now(),
          });
        }

        setNotifications(nextNotifications.slice(0, 4));
      } catch {
        if (alive) setNotifications([]);
      }
    };

    const tick = () => {
      if (document.hidden) return;
      void loadNotifications();
    };

    // Keep badge reasonably fresh without spamming the backend.
    // When dropdown is open, refresh a bit faster.
    tick();
    const intervalMs = notifOpen ? 15000 : 60000;
    const timer = window.setInterval(tick, intervalMs);

    const onVisibility = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [notifOpen]);

  // Auto-scroll active nav item into view in sidebar
  useEffect(() => {
    if (!desktopNavRef.current) return;
    const activeLink = desktopNavRef.current.querySelector("a[class*='bg-brand-600']");
    if (activeLink) {
      activeLink.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (sidebarProfileMenuRef.current && !sidebarProfileMenuRef.current.contains(event.target as Node)) {
        setSidebarProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-dvh bg-[#F8FAFC] text-slate-900 font-sans antialiased flex overflow-hidden">
      {/* Background Ornaments */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-brand-500/5 blur-[120px] rounded-[5px]" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-brand-600/5 blur-[100px] rounded-[5px]" />
      </div>

      {/* Mobile Top Navbar */}
      {!hideMobileBarsOnChatDetail ? (
        <MobileTopBar
          onMenuOpen={() => setMobileDrawerOpen(true)}
          workspaceName={workspace?.name}
          brandName={resolvedBrandName}
          notifications={notifications}
          lastReadAt={lastReadAt}
          markAllRead={markAllRead}
          navigate={navigate}
        />
      ) : null}

      {/* Mobile Bottom Tab Bar */}
      {!hideMobileBarsOnChatDetail ? <MobileBottomTabs /> : null}

      {/* Mobile Drawer */}
      <MobileDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        user={user}
        workspace={workspace}
        brandName={resolvedBrandName}
        navigate={navigate}
      />

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 260 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="hidden lg:flex flex-col bg-white border-r border-slate-200 z-[140] relative h-dvh"
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-[5px] flex items-center justify-center text-white font-black text-xs shadow-lg shadow-brand-500/20">W</div>
              <span className="font-black text-xl tracking-tighter text-slate-900">{resolvedBrandName}</span>
            </motion.div>
          )}
          <button
            onClick={toggleSidebarCollapsed}
            className={cn("p-1.5 hover:bg-slate-100 rounded-[5px] text-slate-400 transition-all", isCollapsed && "mx-auto")}
          >
            {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        <div ref={desktopNavRef} className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {NAV_ITEMS.map((item) => (
            <SideLink key={item.to} {...item} isCollapsed={isCollapsed} />
          ))}
        </div>

        <div className="relative" ref={sidebarProfileMenuRef}>
          <button
            onClick={() => setSidebarProfileMenuOpen(!sidebarProfileMenuOpen)}
            className="w-full p-4 border-t border-slate-100 shrink-0 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
            title={isCollapsed ? "Profile Menu" : undefined}
          >
            <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "px-2")}>
              <div className="w-9 h-9 rounded-[5px] bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs shrink-0 uppercase shadow-sm">
                {user?.name?.[0] || user?.email?.[0] || "?"}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate text-slate-900">{user?.name || "User"}</p>
                  <p className="text-[10px] font-semibold text-slate-400 truncate uppercase tracking-tighter">{workspace?.plan || "Free"} Plan</p>
                </div>
              )}
            </div>
          </button>

          <AnimatePresence>
            {sidebarProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="fixed bg-white rounded-[5px] shadow-2xl border border-slate-100 overflow-hidden z-[500] w-56"
                style={{
                  bottom: isCollapsed ? "80px" : "80px",
                  left: isCollapsed ? "8px" : "20px",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-xs font-black text-slate-900 truncate">{user?.name || "User"}</p>
                  <p className="text-[10px] font-semibold text-slate-500 truncate">{user?.email}</p>
                </div>

                <div className="py-2">
                  <button
                    onClick={() => { navigate("/app/profile"); setSidebarProfileMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-3"
                  >
                    <User size={16} className="text-slate-400" />
                    Profile
                  </button>
                  <button
                    onClick={() => { navigate("/app/plan"); setSidebarProfileMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-3"
                  >
                    <CreditCard size={16} className="text-slate-400" />
                    Plan
                  </button>
                  <button
                    onClick={() => { navigate("/app/settings"); setSidebarProfileMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-3"
                  >
                    <Settings size={16} className="text-slate-400" />
                    Settings
                  </button>
                </div>

                <div className="border-t border-slate-100 py-2">
                  <button
                    onClick={() => { logout(); setSidebarProfileMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-3"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-dvh overflow-hidden relative">
        {/* Global Top Navbar */}
        <header className="hidden lg:flex h-16 items-center justify-between px-8 bg-white/80 backdrop-blur-xl border-b border-slate-200 z-[130] shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              {getShellTitle(location.pathname, NAV_ITEMS as any)}
            </h1>
            <div className="h-4 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-[5px] border border-slate-200/50 shadow-sm">
              <Globe size={14} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{workspace?.name || "Personal"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <WorkspaceStatusBar className="!border-none !bg-transparent !p-0 !backdrop-blur-none" />

            <div className="h-6 w-px bg-slate-200" />

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={cn(
                  "p-2.5 rounded-[5px] relative transition-all group",
                  notifOpen ? "bg-brand-50 text-brand-600" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <Bell size={20} />
                {notifications.some((n: any) => !lastReadAt || Number(n?._eventTime || 0) > lastReadAt) ? (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                ) : null}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white rounded-[5px] shadow-2xl border border-slate-100 overflow-hidden z-50"
                  >
                    <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Notifications</h3>
                      <button onClick={markAllRead} className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { navigate(n.link); setNotifOpen(false); }}
                          className="w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group"
                        >
                          <div className="flex gap-4">
                            <div className={cn("mt-1 w-8 h-8 rounded-[5px] flex items-center justify-center shrink-0", n.bg, n.color)}>
                              {n.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-sm font-black text-slate-900">{n.title}</span>
                                <span className="text-[10px] font-bold text-slate-400">{n.time}</span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{n.desc}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                      {notifications.length === 0 ? (
                        <div className="px-5 py-6 text-center text-xs font-semibold text-slate-400">
                          No recent activity
                        </div>
                      ) : null}
                    </div>
                    <button
                      onClick={() => { navigate("/app/activity"); setNotifOpen(false); }}
                      className="w-full py-3 text-center bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-600 transition-colors"
                    >
                      View All Activity
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-3 p-1.5 pl-3 pr-2 bg-slate-50 border border-slate-200 rounded-[5px] hover:bg-white transition-all group shadow-sm"
              >
                <div className="flex flex-col items-end leading-none">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Current Plan</span>
                  <span className="text-[11px] font-black text-brand-600">{workspace?.plan || "Free"}</span>
                </div>
                <div className="w-8 h-8 rounded-[5px] bg-brand-100 flex items-center justify-center text-brand-700 font-black text-xs shrink-0 shadow-sm">
                  {user?.name?.[0] || user?.email?.[0] || "?"}
                </div>
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-[5px] shadow-xl border border-slate-100 overflow-hidden z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-xs font-black text-slate-900 truncate">{user?.name || "User"}</p>
                      <p className="text-[10px] font-semibold text-slate-500 truncate">{user?.email}</p>
                    </div>

                    <div className="py-2">
                      <button
                        onClick={() => { navigate("/app/profile"); setProfileMenuOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-3"
                      >
                        <div className="w-5 h-5 flex items-center justify-center text-slate-400">
                          <User size={16} />
                        </div>
                        Profile
                      </button>
                      <button
                        onClick={() => { navigate("/app/plan"); setProfileMenuOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-3"
                      >
                        <CreditCard size={16} className="text-slate-400" />
                        Plan
                      </button>
                      <button
                        onClick={() => { navigate("/app/settings"); setProfileMenuOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-3"
                      >
                        <Settings size={16} className="text-slate-400" />
                        Settings
                      </button>
                    </div>

                    <div className="border-t border-slate-100 py-2">
                      <button
                        onClick={() => { logout(); setProfileMenuOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-3"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <main
          className={cn(
            "flex-1 min-h-0 custom-scrollbar relative z-10 lg:pt-0 lg:pb-0",
            hideMobileBarsOnChatDetail ? "overflow-hidden" : "overflow-y-auto",
            hideMobileBarsOnChatDetail ? "pt-0 pb-0" : "pt-14 pb-[68px]"
          )}
        >
          {isPlanAccessBlocked ? (
            <>
              <div className="fixed inset-0 z-[350] bg-white/35 backdrop-blur-[1px]" />
              <div className="fixed inset-0 z-[351] cursor-not-allowed" />
            </>
          ) : null}

          {isPlanAccessBlocked ? (
            <div className="fixed inset-0 z-[360] flex items-center justify-center p-4">
              <div className="w-full max-w-xl rounded-[5px] border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="text-[11px] font-black uppercase tracking-widest text-brand-600">Access Restricted</div>
                <h3 className="mt-2 text-2xl font-black text-slate-900">
                  {(requiredPlan === "pro" || featureNeedsPro) ? "Upgrade to Pro to access this page" : "Buy Basic Plan to continue"}
                </h3>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {(requiredPlan === "pro" || featureNeedsPro)
                    ? "This module is available on Pro plan. Upgrade to unlock this feature."
                    : "This module is available on paid plans. You can preview the UI, but actions are locked until you buy a plan."}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-[5px] bg-brand-600 px-4 py-2 text-sm font-black text-white hover:bg-brand-700 transition-colors"
                    onClick={() => navigate("/app/plan")}
                  >
                    {(requiredPlan === "pro" || featureNeedsPro) ? "Upgrade to Pro" : "Buy Basic Plan"}
                  </button>
                  <button
                    type="button"
                    className="rounded-[5px] border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => navigate("/app/meta")}
                  >
                    Go to WhatsApp Setup
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            <motion.div
              key={routeTransitionKey(location.pathname)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "max-w-[1400px] mx-auto",
                location.pathname.startsWith("/app/conversations") ? "h-full min-h-0" : "min-h-full",
                "p-0"
              )}
            >
              {isAccessCheckPending ? null : children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
