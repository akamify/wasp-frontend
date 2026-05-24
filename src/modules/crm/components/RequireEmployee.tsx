import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEmployeeAuth } from "@modules/crm/providers/EmployeeAuthContext";

export function RequireEmployee() {
  const loc = useLocation();
  const { token } = useEmployeeAuth();
  const safeToken = String(token || "").trim();
  if (!safeToken) return <Navigate to="/employee/login" replace state={{ from: loc.pathname }} />;
  return <Outlet />;
}
