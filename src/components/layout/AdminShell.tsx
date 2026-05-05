import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, FileText, KeyRound, LayoutDashboard, Menu, Wallet, X, Users } from "lucide-react";
import { BRAND_NAME } from "../../config/brand";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", kicker: "summary", icon: LayoutDashboard },
  { id: "users", label: "Users", kicker: "accounts", icon: Users },
  { id: "templates", label: "Templates", kicker: "library", icon: FileText },
  { id: "credentials", label: "Credentials", kicker: "waba access", icon: KeyRound },
  { id: "analytics", label: "Analytics", kicker: "activity", icon: BarChart3 },
  { id: "wallets", label: "Wallets", kicker: "balances", icon: Wallet },
] as const;

function SideLink({ item, isCollapsed }: { item: (typeof NAV_ITEMS)[number]; isCollapsed: boolean }) {
  const { icon: Icon, label, kicker, id } = item;
  return (
    <a
      href={`#${id}`}
      title={isCollapsed ? label : undefined}
      className={cn(
        "group flex cursor-pointer items-center rounded-[5px] border transition-all duration-300 ease-out",
        isCollapsed ? "justify-center p-3" : "justify-between gap-4 px-4 py-3",
        "border-transparent bg-transparent text-ink-900/60 hover:bg-white/50 hover:text-ink-900"
      )}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <Icon className="flex-shrink-0 text-ink-900/40 group-hover:text-ink-900" size={20} />
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="min-w-0">
              <div className="truncate text-[10px] uppercase tracking-[0.22em] opacity-50">{kicker}</div>
              <div className="mt-0.5 truncate text-sm font-semibold">{label}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </a>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("waspakamify_admin_sidebar_collapsed") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem("waspakamify_admin_sidebar_collapsed", isCollapsed ? "1" : "0");
    } catch {}
  }, [isCollapsed]);

  return (
    <div className="relative min-h-dvh bg-paper font-sans text-ink-900 antialiased">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(6,183,126,0.12),transparent_40%)]" />
        <div className="absolute inset-0 bg-grid opacity-20" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] sm:p-4 lg:p-5">
        <header className="sticky top-0 z-40 mb-4 flex items-center justify-between rounded-[5px] border-b border-ink-900/10 bg-white/80 px-4 py-3 backdrop-blur-md lg:hidden">
          <button onClick={() => setMobileNavOpen(true)} className="rounded-[5px] border border-ink-900/5 bg-white p-2">
            <Menu size={20} />
          </button>
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-600">{BRAND_NAME}</div>
            <div className="text-sm font-black">Admin Panel</div>
          </div>
          <button onClick={logout} className="rounded-[5px] border border-ink-900/5 bg-white px-3 py-2 text-xs font-semibold">
            Logout
          </button>
        </header>

        <AnimatePresence>
          {mobileNavOpen ? (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-[60] bg-ink-900/30 backdrop-blur-sm lg:hidden" />
              <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 z-[70] w-[280px] lg:hidden">
                <div className="flex h-full flex-col overflow-hidden rounded-[5px] border bg-white">
                  <div className="flex items-center justify-between border-b border-ink-900/5 p-6">
                    <span className="text-xl font-black tracking-tighter">{BRAND_NAME}</span>
                    <button onClick={() => setMobileNavOpen(false)} className="rounded-[5px] p-1 hover:bg-ink-900/5">
                      <X size={24} />
                    </button>
                  </div>
                  <nav className="flex-1 space-y-2 overflow-y-auto p-4">
                    {NAV_ITEMS.map((item) => <SideLink key={item.id} item={item} isCollapsed={false} />)}
                  </nav>
                  <div className="border-t border-ink-900/5 p-4">
                    <Button variant="danger" className="w-full justify-start gap-3" onClick={logout}>Logout</Button>
                  </div>
                </div>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>

        <div className="flex min-h-[calc(100dvh-2.5rem)] gap-5">
          <motion.aside
            animate={{ width: isCollapsed ? 88 : 280 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="sticky top-5 hidden h-[calc(100dvh-2.5rem)] flex-col overflow-hidden rounded-[5px] border border-ink-900/10 bg-white/70 backdrop-blur-xl lg:flex"
          >
            <div className="flex items-center justify-between border-b border-ink-900/5 p-6">
              {!isCollapsed ? <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-black tracking-tighter">{BRAND_NAME}</motion.span> : null}
              <button onClick={() => setIsCollapsed((prev) => !prev)} className="mx-auto rounded-[5px] p-2 hover:bg-ink-900/5">
                <Menu size={20} />
              </button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto p-3">
              {NAV_ITEMS.map((item) => <SideLink key={item.id} item={item} isCollapsed={isCollapsed} />)}
            </div>
            <div className="border-t border-ink-900/5 bg-white/40 p-4">
              <Button variant="danger" className={cn("justify-start", isCollapsed ? "w-full justify-center px-0" : "w-full gap-3")} onClick={logout}>
                Logout
              </Button>
            </div>
          </motion.aside>

          <main className="min-w-0 flex-1 rounded-[5px] overflow-x-auto overflow-y-visible">
            <motion.div
              key={location.pathname}
              // Avoid transforms here for the same reason as AppShell: it breaks `position: fixed` descendants.
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="h-full rounded-[5px] p-0"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
