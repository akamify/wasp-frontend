import { Route } from "react-router-dom";
import LandingPage from "@pages/Landing";
import LoginPage from "@pages/auth/pages/Login";
import AdminLoginPage from "@pages/auth/pages/AdminLogin";
import RegisterPage from "@pages/auth/pages/Register";
import ForgotPasswordPage from "@pages/auth/pages/ForgotPassword";
import ResetPasswordPage from "@pages/auth/pages/ResetPassword";
import AdminForgotPasswordPage from "@pages/auth/pages/AdminForgotPassword";
import AdminResetPasswordPage from "@pages/auth/pages/AdminResetPassword";
import NotFoundPage from "@pages/NotFound";
import HelpCenterPage from "@pages/public/HelpCenter";
import RaiseTicketPage from "@pages/public/RaiseTicket";
import CareersPage from "@pages/public/Careers";
import { PublicCmsPage } from "@pages/public/PublicCmsPage";
import EmployeeLoginPage from "@modules/crm/pages/EmployeeLogin";
import EmployeeResetPasswordPage from "@modules/crm/pages/EmployeeResetPassword";

export function publicRoutes() {
  return (
    <>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<PublicCmsPage slug="about" />} />
      <Route path="/privacy-policy" element={<PublicCmsPage slug="privacy-policy" />} />
      <Route path="/terms-of-service" element={<PublicCmsPage slug="terms-of-service" />} />
      <Route path="/cookie-policy" element={<PublicCmsPage slug="cookie-policy" />} />
      <Route path="/help-center" element={<HelpCenterPage />} />
      <Route path="/help-center/ticket" element={<RaiseTicketPage />} />
      <Route path="/careers" element={<CareersPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
      <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
      <Route path="/employee/login" element={<EmployeeLoginPage />} />
      <Route path="/employee/reset-password" element={<EmployeeResetPasswordPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </>
  );
}
