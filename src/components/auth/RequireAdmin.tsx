import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "../ui/Spinner";

export function RequireAdmin() {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner label="Loading admin session..." />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
