import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";
import { useAuth } from "../../context/AuthContext";
import { BRAND_NAME } from "../../config/brand";
import { motion, AnimatePresence } from "framer-motion"; // Added for smooth animations
import { 
  LayoutDashboard, Key, FileText, Send, Users, 
  MessageSquare, Link2, Zap, PanelLeftClose, 
  PanelLeftOpen, Settings, LogOut, Menu, X, Wallet, Workflow
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/app", label: "Dashboard", kicker: "overview", icon: LayoutDashboard },
  { to: "/app/meta", label: "WhatsApp Setup", kicker: "manual credentials", icon: Key },
  { to: "/app/templates", label: "Templates", kicker: "approve library", icon: FileText },
  { to: "/app/send", label: "Broadcasts", kicker: "campaign launch", icon: Send },
  { to: "/app/contacts", label: "Contacts", kicker: "audience", icon: Users },
  { to: "/app/conversations", label: "Inbox", kicker: "chatroom", icon: MessageSquare },
  { to: "/app/flows", label: "Flows", kicker: "forms", icon: Workflow },
  { to: "/app/wallet", label: "Wallet", kicker: "buy credits", icon: Wallet },
  { to: "/app/links", label: "Tracked links", kicker: "analytics", icon: Link2 },
  { to: "/app/automation", label: "Automation", kicker: "events", icon: Zap },
];

function SideLink({ to, label, kicker, icon: Icon, isCollapsed }: any) {
  return (
    <NavLink
      to={to}
      title={isCollapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          "group flex cursor-pointer items-center rounded-[5px] border transition-all duration-300 ease-out",
          isCollapsed ? "justify-center p-3" : "justify-between px-4 py-3 gap-4",
          isActive
            ? "border-brand-400/40 bg-brand-50 text-ink-900"
            : "border-transparent bg-transparent text-ink-900/60 hover:bg-white/50 hover:text-ink-900"
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-3 overflow-hidden">
            <Icon className={cn("flex-shrink-0 transition-colors", isActive ? "text-brand-600" : "text-ink-900/40 group-hover:text-ink-900")} size={20} />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -10 }}
                  className="min-w-0"
                >
                  <div className="text-[10px] uppercase tracking-[0.22em] opacity-50 truncate">{kicker}</div>
                  <div className="mt-0.5 text-sm font-semibold truncate">{label}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* {!isCollapsed && <div className={cn("text-lg transition-all", isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0")}>&gt;</div>} */}
        </>
      )}
    </NavLink>
  );
}

function getShellTitle(pathname: string, items: typeof NAV_ITEMS) {
  const active = items.find((item) => item.to === "/app" ? pathname === item.to : pathname.startsWith(item.to));
  return active?.label || "Workspace";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("waspakamify_sidebar_collapsed") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => { setMobileNavOpen(false); }, [location.pathname]);
  useEffect(() => {
    try {
      localStorage.setItem("waspakamify_sidebar_collapsed", isCollapsed ? "1" : "0");
    } catch {}
  }, [isCollapsed]);

  return (
    <div className="min-h-dvh bg-paper text-ink-900 font-sans antialiased relative">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(6,183,126,0.12),transparent_40%)]" />
        <div className="absolute inset-0 bg-grid opacity-20" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] sm:p-4 lg:p-5">
        
        {/* STICKY MOBILE NAVBAR */}
        <header className="sticky top-0 z-40 mb-4 flex items-center justify-between rounded-[5px] border-b border-ink-900/10 bg-white/80 px-4 py-3 backdrop-blur-md lg:hidden">
          <button onClick={() => setMobileNavOpen(true)} className="cursor-pointer rounded-[5px] border border-ink-900/5 bg-white p-2 transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-95">
            <Menu size={20} />
          </button>
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-600">{BRAND_NAME}</div>
            <div className="text-sm font-black">{getShellTitle(location.pathname, NAV_ITEMS as any)}</div>
          </div>
          <button onClick={() => navigate("/app/settings")} className="cursor-pointer rounded-[5px] border border-ink-900/5 bg-white p-2 transition-all duration-200 ease-out hover:-translate-y-0.5">
            <Settings size={20} />
          </button>
        </header>

        {/* MOBILE DRAWER WITH ANIMATION */}
        <AnimatePresence>
          {mobileNavOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMobileNavOpen(false)}
                className="fixed inset-0 z-[60] bg-ink-900/30 backdrop-blur-sm lg:hidden"
              />
              <motion.div 
                initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-[70] w-[280px] lg:hidden"
              >
                <div className="flex h-full flex-col overflow-hidden rounded-[5px] border bg-white">
                  <div className="p-6 flex justify-between items-center border-b border-ink-900/5">
                    <span className="font-black text-xl tracking-tighter">{BRAND_NAME}</span>
                    <button onClick={() => setMobileNavOpen(false)} className="cursor-pointer rounded-[5px] p-1 transition-colors duration-200 hover:bg-ink-900/5"><X size={24} /></button>
                  </div>
                  <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {NAV_ITEMS.map((item) => <SideLink key={item.to} {...item} isCollapsed={false} />)}
                  </nav>
                  <div className="p-4 border-t border-ink-900/5 space-y-2">
                    <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => navigate("/app/settings")}><Settings size={18}/> Settings</Button>
                    <Button variant="danger" className="w-full justify-start gap-3" onClick={() => logout()}><LogOut size={18}/> Logout</Button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-h-[calc(100dvh-2.5rem)] gap-5">
          
          {/* DESKTOP SIDEBAR WITH WIDTH ANIMATION */}
          <motion.aside 
            animate={{ width: isCollapsed ? 88 : 280 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="hidden lg:flex flex-col sticky top-5 h-[calc(100dvh-2.5rem)] rounded-[5px] border border-ink-900/10 bg-white/70 backdrop-blur-xl z-20 overflow-hidden"
          >
            <div className="p-6 flex items-center justify-between border-b border-ink-900/5">
              {!isCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-black text-xl tracking-tighter">{BRAND_NAME}</motion.span>}
              <button onClick={() => setIsCollapsed(!isCollapsed)} className="mx-auto cursor-pointer rounded-[5px] p-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-ink-900/5">
                {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
              {NAV_ITEMS.map((item) => (
                <SideLink key={item.to} {...item} isCollapsed={isCollapsed} />
              ))}
            </div>

            <div className="p-4 border-t border-ink-900/5 bg-white/40 space-y-2">
              <Button variant="ghost" className={cn("justify-start transition-all", isCollapsed ? "px-0 w-full justify-center" : "w-full gap-3")} onClick={() => navigate("/app/settings")}>
                <Settings size={18} /> {!isCollapsed && "Settings"}
              </Button>
              <Button variant="danger" className={cn("justify-start transition-all", isCollapsed ? "px-0 w-full justify-center" : "w-full gap-3")} onClick={() => logout()}>
                <LogOut size={18} /> {!isCollapsed && "Logout"}
              </Button>
            </div>
          </motion.aside>

          {/* MAIN CONTENT AREA WITH PAGE TRANSITION */}
          {/*
            Horizontal scrolling fixes "right side hides when sidebar opens" on wide pages.
            But `overflow` on an ancestor breaks `position: sticky` (Template builder preview).
            So we enable overflow-x auto for most pages and keep it visible on templates route.
          */}
          <main
            className={cn(
              "flex-1 min-w-0 rounded-[5px] overflow-y-visible",
              location.pathname.startsWith("/app/templates") ? "overflow-x-visible" : "overflow-x-auto"
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname} // This triggers animation on route change
                // Avoid transforms here: a transformed ancestor turns `position: fixed` descendants
                // into "fixed within the container", which breaks right-side panels across pages.
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full rounded-[5px] p-0"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
