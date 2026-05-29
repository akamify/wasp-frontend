import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { SessionSkeleton } from "../ui/Skeletons";
import { normalizeRole } from "../../shared/utils/authRole";

export function RequireAdmin() {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <SessionSkeleton />;
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const role = normalizeRole(user?.role);

  if (role === "super_admin") {
    return <Navigate to="/super-admin" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
