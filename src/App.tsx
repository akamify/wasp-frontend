import { Routes } from "react-router-dom";
import { AuthProvider } from "@shared/providers/AuthContext";
import { ToastProvider } from "@shared/providers/ToastContext";
import { EmployeeAuthProvider } from "@modules/crm/providers/EmployeeAuthContext";
import { PublicRoutes } from "@app/routes/public.routes";
import { EmployeeRoutes } from "@app/routes/employee.routes";
import { UserRoutes } from "@app/routes/user.routes";
import { AdminRoutes } from "@app/routes/admin.routes";
import { SuperAdminRoutes } from "@app/routes/superAdmin.routes";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <EmployeeAuthProvider>
          <Routes>
            <PublicRoutes />
            <EmployeeRoutes />
            <UserRoutes />
            <AdminRoutes />
            <SuperAdminRoutes />
          </Routes>
        </EmployeeAuthProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
