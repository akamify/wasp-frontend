import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { SessionSkeleton } from "../ui/Skeletons";

export function RequireAdmin() {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <SessionSkeleton />;
  }

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
