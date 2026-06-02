import { AnimatePresence, motion } from "framer-motion";
import { CreditCard, LogOut, PanelLeftClose, PanelLeftOpen, Settings, User } from "lucide-react";
import { cn } from "@shared/utils/cn";
import { NAV_ITEMS } from "@components/layout/app-shell/constants";
import { SideLink } from "@components/layout/app-shell/SideLink";
import { BRAND_NAME } from "@shared/config/brand";

export function DesktopSidebar({
  isCollapsed,
  resolvedBrandName,
  user,
  workspace,
  sidebarProfileMenuOpen,
  setSidebarProfileMenuOpen,
  toggleSidebarCollapsed,
  logout,
  navigate,
  desktopNavRef,
  sidebarProfileMenuRef,
}: any) {
  return (
    <motion.aside animate={{ width: isCollapsed ? 80 : 260 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="hidden lg:flex flex-col bg-white border-r border-slate-200 z-[140] relative h-dvh">
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
        {!isCollapsed ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
            <img src="logo.png" alt={BRAND_NAME} />
            </div>
            <span className="font-black text-xl tracking-tighter text-slate-900">{resolvedBrandName}</span>
          </motion.div>
        ) : null}
        <button onClick={toggleSidebarCollapsed} className={cn("p-1.5 hover:bg-slate-100 rounded-[5px] text-slate-400 transition-all", isCollapsed && "mx-auto")}>
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <div ref={desktopNavRef} className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {NAV_ITEMS.map((item) => <SideLink key={item.to} {...item} isCollapsed={isCollapsed} />)}
      </div>

      <div className="relative" ref={sidebarProfileMenuRef}>
        <button onClick={() => setSidebarProfileMenuOpen(!sidebarProfileMenuOpen)} className="w-full p-4 border-t border-slate-100 shrink-0 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left" title={isCollapsed ? "Profile Menu" : undefined}>
          <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "px-2")}>
            <div className="w-9 h-9 rounded-[5px] bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs shrink-0 uppercase shadow-sm">{user?.name?.[0] || user?.email?.[0] || "?"}</div>
            {!isCollapsed ? <div className="min-w-0 flex-1"><p className="text-sm font-bold truncate text-slate-900">{user?.name || "User"}</p><p className="text-[10px] font-semibold text-slate-400 truncate uppercase tracking-tighter">{workspace?.plan || "Free"} Plan</p></div> : null}
          </div>
        </button>

        <AnimatePresence>
          {sidebarProfileMenuOpen ? (
            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }} className="fixed bg-white rounded-[5px] shadow-2xl border border-slate-100 overflow-hidden z-[500] w-56" style={{ bottom: "80px", left: isCollapsed ? "8px" : "20px" }} onClick={(e) => e.stopPropagation()}>
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50"><p className="text-xs font-black text-slate-900 truncate">{user?.name || "User"}</p><p className="text-[10px] font-semibold text-slate-500 truncate">{user?.email}</p></div>
              <div className="py-2">
                <button onClick={() => { navigate("/app/profile"); setSidebarProfileMenuOpen(false); }} className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-3"><User size={16} className="text-slate-400" />Profile</button>
                <button onClick={() => { navigate("/app/plan"); setSidebarProfileMenuOpen(false); }} className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-3"><CreditCard size={16} className="text-slate-400" />Plan</button>
                <button onClick={() => { navigate("/app/settings"); setSidebarProfileMenuOpen(false); }} className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-3"><Settings size={16} className="text-slate-400" />Settings</button>
              </div>
              <div className="border-t border-slate-100 py-2">
                <button onClick={() => { logout(); setSidebarProfileMenuOpen(false); }} className="w-full px-4 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-3"><LogOut size={16} />Logout</button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}

