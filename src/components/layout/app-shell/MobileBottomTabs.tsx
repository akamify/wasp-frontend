import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@shared/utils/cn";
import { MOBILE_TABS } from "./constants";

export function MobileBottomTabs() {
  const location = useLocation();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[200] bg-white/95 backdrop-blur-xl border-t border-slate-200 safe-area-bottom">
      <div className="flex items-stretch justify-around h-[60px]">
        {MOBILE_TABS.map((tab) => {
          const isActive = tab.end ? location.pathname === tab.to : location.pathname.startsWith(tab.to);
          return (
            <NavLink key={tab.to} to={tab.to} end={tab.end} className="flex flex-col items-center justify-center flex-1 gap-0.5 relative transition-colors">
              {isActive ? <motion.div layoutId="mobile-tab-indicator" className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-brand-600 rounded-b-full" transition={{ type: "spring", stiffness: 400, damping: 30 }} /> : null}
              <tab.icon size={20} className={cn("transition-colors", isActive ? "text-brand-600" : "text-slate-400")} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={cn("text-[10px] font-semibold leading-none tracking-tight", isActive ? "text-brand-600 font-bold" : "text-slate-400")}>{tab.label}</span>
            </NavLink>
          );
        })}
        <button onClick={() => window.dispatchEvent(new CustomEvent("open-mobile-drawer"))} className="flex flex-col items-center justify-center flex-1 gap-0.5 text-slate-400 hover:text-slate-600 transition-colors">
          <MoreHorizontal size={20} strokeWidth={1.8} />
          <span className="text-[10px] font-semibold leading-none tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
}
