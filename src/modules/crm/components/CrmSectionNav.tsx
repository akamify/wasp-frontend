import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@shared/utils/cn";

const ITEMS = [
  { to: "/app/crm", label: "Dashboard" },
  { to: "/app/crm/leads", label: "Leads" },
  { to: "/app/crm/employees", label: "Employees" },
  { to: "/app/crm/settings", label: "Settings" },
] as const;

export function CrmSectionNav() {
  const location = useLocation();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {ITEMS.map((item) => {
        const isActive =
          item.to === "/app/crm"
            ? location.pathname === "/app/crm"
            : location.pathname.startsWith(item.to);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              "h-9 rounded-[5px] px-3 inline-flex items-center text-[11px] font-black uppercase tracking-widest border transition-colors",
              isActive
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            )}
          >
            {item.label}
          </NavLink>
        );
      })}
    </div>
  );
}
