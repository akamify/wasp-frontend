import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@shared/providers/AuthContext";
import { SessionSkeleton } from "@components/ui/Skeletons";

export function RequireAuth() {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <SessionSkeleton />;
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
