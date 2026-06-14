import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@shared/utils/cn";
import { useAuth } from "@shared/providers/AuthContext";
import { BRAND_NAME } from "@shared/config/brand";
import { API } from "@api/api";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_ITEMS, getShellTitle, routeTransitionKey } from "@components/layout/app-shell/constants";
import { MobileBottomTabs } from "@components/layout/app-shell/MobileBottomTabs";
import { MobileTopBar } from "@components/layout/app-shell/MobileTopBar";
import { MobileDrawer } from "@components/layout/app-shell/MobileDrawer";
import { DesktopSidebar } from "@components/layout/app-shell/DesktopSidebar";
import { DesktopTopBar } from "@components/layout/app-shell/DesktopTopBar";
import { PlanAccessOverlay } from "@components/layout/app-shell/PlanAccessOverlay";
import { useAppShellBilling } from "@components/layout/app-shell/useAppShellBilling";
import { useAppShellNotifications } from "@components/layout/app-shell/useAppShellNotifications";


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
  const isAutomationBuilder =
    location.pathname.startsWith("/app/automation/") &&
    location.pathname !== "/app/automation/events";
  const hideMobileBars = hideMobileBarsOnChatDetail || isAutomationBuilder;

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
  const { notifications, lastReadAt, markAllRead } = useAppShellNotifications(notifOpen);
  const { requiredPlan, featureNeedsPro, isPlanAccessBlocked, isAccessCheckPending } = useAppShellBilling(location.pathname);

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
      {!hideMobileBars ? (
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
      {!hideMobileBars ? <MobileBottomTabs /> : null}

      {/* Mobile Drawer */}
      <MobileDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        user={user}
        workspace={workspace}
        brandName={resolvedBrandName}
        navigate={navigate}
      />

      <DesktopSidebar
        isCollapsed={isCollapsed}
        resolvedBrandName={resolvedBrandName}
        user={user}
        workspace={workspace}
        sidebarProfileMenuOpen={sidebarProfileMenuOpen}
        setSidebarProfileMenuOpen={setSidebarProfileMenuOpen}
        toggleSidebarCollapsed={toggleSidebarCollapsed}
        logout={logout}
        navigate={navigate}
        desktopNavRef={desktopNavRef}
        sidebarProfileMenuRef={sidebarProfileMenuRef}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-dvh overflow-hidden relative">
        <DesktopTopBar
          pathname={location.pathname}
          workspace={workspace}
          user={user}
          notifOpen={notifOpen}
          setNotifOpen={setNotifOpen}
          notifications={notifications}
          lastReadAt={lastReadAt}
          markAllRead={markAllRead}
          profileMenuOpen={profileMenuOpen}
          setProfileMenuOpen={setProfileMenuOpen}
          navigate={navigate}
          logout={logout}
          notifRef={notifRef}
          profileMenuRef={profileMenuRef}
        />

        {/* Scrollable Content Container */}
        <main
          className={cn(
            "flex-1 min-h-0 custom-scrollbar relative z-10 lg:pt-0 lg:pb-0",
            hideMobileBars ? "overflow-hidden pt-0 pb-0" : "overflow-y-auto pt-14 pb-[68px]"
          )}
        >
          <PlanAccessOverlay show={isPlanAccessBlocked} requiredPlan={requiredPlan} featureNeedsPro={featureNeedsPro} navigate={navigate} />

          <AnimatePresence mode="wait">
            <motion.div
              key={routeTransitionKey(location.pathname)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={cn(
                isAutomationBuilder ? "max-w-none" : "max-w-[1400px] mx-auto",
                location.pathname.startsWith("/app/conversations") || isAutomationBuilder ? "h-full min-h-0" : "min-h-full",
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

