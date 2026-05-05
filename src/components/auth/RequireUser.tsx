import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "../ui/Spinner";

export function RequireUser() {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner label="Loading session..." />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
