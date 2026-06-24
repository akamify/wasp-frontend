import { motion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@shared/utils/cn";

type Props = {
  to: string;
  label: string;
  kicker: string;
  icon: LucideIcon;
  isCollapsed: boolean;
  unreadCount?: number;
};

export function SideLink({ to, label, kicker, icon: Icon, isCollapsed, unreadCount = 0 }: Props) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== "/app" && location.pathname.startsWith(to));
  const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);
  return (
    <NavLink
      to={to}
      end={to === "/app"}
      title={isCollapsed ? label : undefined}
      className={({ isActive: linkActive }) =>
        cn(
          "group relative flex cursor-pointer items-center rounded-[5px] transition-all duration-200 ease-in-out",
          isCollapsed ? "justify-center p-3" : "px-4 py-2.5 gap-3",
          linkActive ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20" : "text-ink-900/60 hover:bg-ink-900/5 hover:text-ink-900"
        )
      }
    >
      <Icon className={cn("flex-shrink-0 transition-transform group-hover:scale-110", isCollapsed ? "size-6" : "size-5")} />
      {!isCollapsed ? <div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{label}</div><div className={cn("text-[10px] uppercase tracking-wider opacity-60 truncate font-medium", isCollapsed ? "hidden" : "block")}>{kicker}</div></div> : null}
      {Number(unreadCount) > 0 ? (
        <span
          className={cn(
            "bg-rose-500 text-white font-black flex items-center justify-center ring-2 ring-white",
            isCollapsed
              ? "absolute right-1 top-1 min-w-4 h-4 px-0.5 rounded-[4px] text-[9px] leading-none"
              : "min-w-5 h-5 px-1 rounded-[5px] text-[10px]"
          )}
        >
          {unreadLabel}
        </span>
      ) : null}
      {isActive ? <motion.div layoutId="active-nav" className="absolute -left-1 w-1.5 h-6 bg-white rounded-r-[5px]" /> : null}
    </NavLink>
  );
}
