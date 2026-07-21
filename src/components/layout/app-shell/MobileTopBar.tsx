import { AnimatePresence, motion } from "framer-motion";
import { Bell, BookOpen, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@shared/utils/cn";

export function MobileTopBar({ onMenuOpen, workspaceName, brandName, notifications, lastReadAt, markAllRead, navigate, docsUrl }: any) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-[200] h-14 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between px-3">
      <button onClick={onMenuOpen} className="p-2 hover:bg-slate-100 rounded-[5px] active:scale-95 transition-all"><Menu size={22} className="text-slate-700" /></button>
      <div className="flex flex-col items-center"><span className="text-[10px] font-black text-brand-600 uppercase tracking-tighter leading-none">{brandName}</span><span className="text-xs font-bold truncate max-w-[140px] text-slate-800">{workspaceName || "Workspace"}</span></div>
      <div className="flex items-center gap-1">
        {docsUrl ? (
          <a
            href={docsUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-[5px] text-slate-500 hover:bg-slate-100 hover:text-brand-600 active:scale-95 transition-all"
            aria-label="Open documentation"
            title="Open documentation"
          >
            <BookOpen size={19} />
          </a>
        ) : null}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen(!notifOpen)} className={cn("p-2 rounded-[5px] relative transition-all active:scale-95", notifOpen ? "bg-brand-50 text-brand-600" : "text-slate-500 hover:bg-slate-100")}>
            <Bell size={20} />
            {notifications.some((n: any) => !lastReadAt || Number(n?._eventTime || 0) > lastReadAt) ? <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" /> : null}
          </button>
          <AnimatePresence>
            {notifOpen ? <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-1 mt-2 w-86 bg-white rounded-[5px] shadow-2xl border border-slate-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between"><h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Notifications</h3><button onClick={markAllRead} className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline">Read all</button></div>
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar">{notifications.map((n: any) => <button key={n.id} onClick={() => { navigate(n.link); setNotifOpen(false); }} className="w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group"><div className="flex gap-4"><div className={cn("mt-1 w-8 h-8 rounded-[5px] flex items-center justify-center shrink-0", n.bg, n.color)}>{n.icon}</div><div className="flex-1 min-w-0"><div className="flex items-center justify-between mb-0.5"><span className="text-sm font-black text-slate-900">{n.title}</span><span className="text-[10px] font-bold text-slate-400">{n.time}</span></div><p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{n.desc}</p></div></div></button>)}{notifications.length === 0 ? <div className="px-5 py-6 text-center text-xs font-semibold text-slate-400">No recent activity</div> : null}</div>
              <button onClick={() => { navigate("/app/activity"); setNotifOpen(false); }} className="w-full py-3 text-center bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-600 transition-colors">View All Activity</button>
            </motion.div> : null}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
