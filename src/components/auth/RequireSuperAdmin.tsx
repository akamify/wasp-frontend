import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { SessionSkeleton } from "../ui/Skeletons";
import { normalizeRole } from "../../shared/utils/authRole";

export function RequireSuperAdmin() {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <SessionSkeleton />;
  }

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (normalizeRole(user?.role) !== "super_admin") {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
