import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getEmployeeToken } from "@modules/crm/services/employeeAuthStorage";

export function RequireEmployee() {
  const loc = useLocation();
  const token = String(getEmployeeToken() || "").trim();
  if (!token) return <Navigate to="/employee/login" replace state={{ from: loc.pathname }} />;
  return <Outlet />;
}

