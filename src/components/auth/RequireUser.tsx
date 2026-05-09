import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { SessionSkeleton } from "../ui/Skeletons";

export function RequireUser() {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <SessionSkeleton />;
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
