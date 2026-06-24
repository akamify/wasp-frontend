import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@shared/utils/cn";
import { NAV_ITEMS } from "./constants";

export function MobileDrawer({ open, onClose, user, workspace, brandName, navigate, unreadCount = 0 }: any) {
  const location = useLocation();
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="lg:hidden fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm" />
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="lg:hidden fixed top-0 left-0 bottom-0 z-[301] w-[280px] bg-white flex flex-col shadow-2xl">
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100 shrink-0"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-brand-600 rounded-[5px] flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-brand-500/20">W</div><span className="font-black text-base tracking-tighter text-slate-900">{brandName}</span></div><button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-[5px] text-slate-400 active:scale-95 transition-all"><X size={20} /></button></div>
            <div className="flex-1 overflow-y-auto custom-scrollbar py-3 px-3">
              {NAV_ITEMS.map((item) => {
                const isActive = item.to === "/app" ? location.pathname === item.to : location.pathname.startsWith(item.to);
                return (
                  <NavLink key={item.to} to={item.to} end={item.to === "/app"} onClick={onClose} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-[5px] transition-all mb-0.5", isActive ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20" : "text-slate-600 hover:bg-slate-50 active:bg-slate-100")}>
                    <item.icon size={18} className="shrink-0" strokeWidth={isActive ? 2.5 : 1.8} />
                    <div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{item.label}</div><div className={cn("text-[9px] uppercase tracking-wider font-medium", isActive ? "text-white/60" : "text-slate-400")}>{item.kicker}</div></div>
                    {item.to === "/app/conversations" && Number(unreadCount) > 0 ? <span className="min-w-5 h-5 px-1 rounded-[5px] bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">{Number(unreadCount)}</span> : null}
                    {isActive ? <ChevronRight size={14} className="text-white/60" /> : null}
                  </NavLink>
                );
              })}
            </div>
            <button onClick={() => navigate("/app/profile")} className="p-4 border-t border-slate-100 shrink-0 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"><div className="flex items-center gap-3 px-1"><div className="w-9 h-9 rounded-[5px] bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs shrink-0 uppercase shadow-sm">{user?.name?.[0] || user?.email?.[0] || "?"}</div><div className="min-w-0 flex-1"><p className="text-sm font-bold truncate text-slate-900">{user?.name || "User"}</p><p className="text-[10px] font-semibold text-slate-400 truncate uppercase tracking-tighter">{workspace?.plan || "Free"} Plan</p></div></div></button>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
