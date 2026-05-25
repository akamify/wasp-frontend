import { Routes } from "react-router-dom";
import { AuthProvider } from "@shared/providers/AuthContext";
import { ToastProvider } from "@shared/providers/ToastContext";
import { EmployeeAuthProvider } from "@modules/crm/providers/EmployeeAuthContext";
import { publicRoutes } from "@app/routes/public.routes";
import { employeeRoutes } from "@app/routes/employee.routes";
import { userRoutes } from "@app/routes/user.routes";
import { adminRoutes } from "@app/routes/admin.routes";
import { superAdminRoutes } from "@app/routes/superAdmin.routes";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <EmployeeAuthProvider>
          <Routes>
            {publicRoutes()}
            {employeeRoutes()}
            {userRoutes()}
            {adminRoutes()}
            {superAdminRoutes()}
          </Routes>
        </EmployeeAuthProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
