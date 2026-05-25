import { AnimatePresence, motion } from "framer-motion";
import { Bell, CreditCard, Globe, LogOut, Settings, User } from "lucide-react";
import type { RefObject } from "react";
import { cn } from "@shared/utils/cn";
import { WorkspaceStatusBar } from "@components/layout/WorkspaceStatusBar";
import { NAV_ITEMS, getShellTitle } from "@components/layout/app-shell/constants";
import type { AppNotification } from "@components/layout/app-shell/types";

export function DesktopTopBar({
  pathname,
  workspace,
  user,
  notifOpen,
  setNotifOpen,
  notifications,
  lastReadAt,
  markAllRead,
  profileMenuOpen,
  setProfileMenuOpen,
  navigate,
  logout,
  notifRef,
  profileMenuRef,
}: {
  pathname: string;
  workspace: any;
  user: any;
  notifOpen: boolean;
  setNotifOpen: (value: boolean) => void;
  notifications: AppNotification[];
  lastReadAt: number;
  markAllRead: () => void;
  profileMenuOpen: boolean;
  setProfileMenuOpen: (value: boolean) => void;
  navigate: (to: string) => void;
  logout: () => void;
  notifRef: RefObject<HTMLDivElement | null>;
  profileMenuRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <header className="hidden lg:flex h-16 items-center justify-between px-8 bg-white/80 backdrop-blur-xl border-b border-slate-200 z-[130] shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-black text-slate-900 tracking-tight">{getShellTitle(pathname, NAV_ITEMS as any)}</h1>
        <div className="h-4 w-px bg-slate-200 mx-2" />
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-[5px] border border-slate-200/50 shadow-sm">
          <Globe size={14} className="text-slate-400" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{workspace?.name || "Personal"}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <WorkspaceStatusBar className="!border-none !bg-transparent !p-0 !backdrop-blur-none" />
        <div className="h-6 w-px bg-slate-200" />
        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen(!notifOpen)} className={cn("p-2.5 rounded-[5px] relative transition-all group", notifOpen ? "bg-brand-50 text-brand-600" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100")}><Bell size={20} />{notifications.some((n: AppNotification) => !lastReadAt || Number(n?._eventTime || 0) > lastReadAt) ? <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" /> : null}</button>
          <AnimatePresence>
            {notifOpen ? (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-3 w-80 bg-white rounded-[5px] shadow-2xl border border-slate-100 overflow-hidden z-50">
                <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between"><h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Notifications</h3><button onClick={markAllRead} className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline">Mark all read</button></div>
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">{notifications.map((n) => <button key={n.id} onClick={() => { navigate(n.link); setNotifOpen(false); }} className="w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group"><div className="flex gap-4"><div className={cn("mt-1 w-8 h-8 rounded-[5px] flex items-center justify-center shrink-0", n.bg, n.color)}>{n.icon}</div><div className="flex-1 min-w-0"><div className="flex items-center justify-between mb-0.5"><span className="text-sm font-black text-slate-900">{n.title}</span><span className="text-[10px] font-bold text-slate-400">{n.time}</span></div><p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{n.desc}</p></div></div></button>)}{notifications.length === 0 ? <div className="px-5 py-6 text-center text-xs font-semibold text-slate-400">No recent activity</div> : null}</div>
                <button onClick={() => { navigate("/app/activity"); setNotifOpen(false); }} className="w-full py-3 text-center bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-600 transition-colors">View All Activity</button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <div className="relative" ref={profileMenuRef}>
          <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="flex items-center gap-3 p-1.5 pl-3 pr-2 bg-slate-50 border border-slate-200 rounded-[5px] hover:bg-white transition-all group shadow-sm"><div className="flex flex-col items-end leading-none"><span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Current Plan</span><span className="text-[11px] font-black text-brand-600">{workspace?.plan || "Free"}</span></div><div className="w-8 h-8 rounded-[5px] bg-brand-100 flex items-center justify-center text-brand-700 font-black text-xs shrink-0 shadow-sm">{user?.name?.[0] || user?.email?.[0] || "?"}</div></button>
          <AnimatePresence>
            {profileMenuOpen ? (
              <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute right-0 mt-2 w-48 bg-white rounded-[5px] shadow-xl border border-slate-100 overflow-hidden z-50" onClick={(e) => e.stopPropagation()}>
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50"><p className="text-xs font-black text-slate-900 truncate">{user?.name || "User"}</p><p className="text-[10px] font-semibold text-slate-500 truncate">{user?.email}</p></div>
                <div className="py-2">
                  <button onClick={() => { navigate("/app/profile"); setProfileMenuOpen(false); }} className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-3"><div className="w-5 h-5 flex items-center justify-center text-slate-400"><User size={16} /></div>Profile</button>
                  <button onClick={() => { navigate("/app/plan"); setProfileMenuOpen(false); }} className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-3"><CreditCard size={16} className="text-slate-400" />Plan</button>
                  <button onClick={() => { navigate("/app/settings"); setProfileMenuOpen(false); }} className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-3"><Settings size={16} className="text-slate-400" />Settings</button>
                </div>
                <div className="border-t border-slate-100 py-2"><button onClick={() => { logout(); setProfileMenuOpen(false); }} className="w-full px-4 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-3"><LogOut size={16} />Logout</button></div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
