import { Link, useLocation } from "react-router-dom";
import { cn } from "@shared/utils/cn";
import { useEmployeeAuth } from "@modules/crm/providers/EmployeeAuthContext";
import { useEffect, useState } from "react";
import { API } from "@api/api";
import { BRAND_NAME } from "@shared/config/brand";

function NavLink({ to, label }: { to: string; label: string }) {
  const loc = useLocation();
  const active = String(loc.pathname || "").startsWith(to);
  return (
    <Link
      to={to}
      className={cn(
        "px-3 py-2 rounded-[8px] text-sm font-black tracking-tight",
        active ? "bg-brand-50 text-brand-700 border border-brand-100" : "text-slate-600 hover:bg-slate-50"
      )}
    >
      {label}
    </Link>
  );
}

export function EmployeeShell({ children }: { children: React.ReactNode }) {
  const { employee, logout } = useEmployeeAuth();
  const [runtimeBrandName, setRuntimeBrandName] = useState("");
  const resolvedBrandName = runtimeBrandName || BRAND_NAME;

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

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <div className="h-16 border-b border-slate-200 bg-white px-4 flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-xs font-black text-brand-600 uppercase tracking-widest">{resolvedBrandName}</div>
          <div className="text-sm font-black text-slate-900 truncate">{employee?.workspaceId || "-"}</div>
        </div>
        <div className="flex items-center gap-2">
          <NavLink to="/employee/inbox" label="Inbox" />
          <NavLink to="/employee/leads" label="Leads" />
          <NavLink to="/employee/profile" label="Profile" />
          <button
            type="button"
            onClick={logout}
            className="ml-2 px-3 py-2 rounded-[8px] text-sm font-black text-slate-600 hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
