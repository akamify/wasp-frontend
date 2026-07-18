import { Route } from "react-router-dom";
import LandingPage from "@pages/Landing";
import LoginPage from "@pages/auth/pages/Login";
import RegisterPage from "@pages/auth/pages/Register";
import ForgotPasswordPage from "@pages/auth/pages/ForgotPassword";
import ResetPasswordPage from "@pages/auth/pages/ResetPassword";
import AdminForgotPasswordPage from "@pages/auth/pages/AdminForgotPassword";
import AdminResetPasswordPage from "@pages/auth/pages/AdminResetPassword";
import NotFoundPage from "@pages/NotFound";
import HelpCenterPage from "@pages/public/HelpCenter";
import RaiseTicketPage from "@pages/public/RaiseTicket";
import CareersPage from "@pages/public/Careers";
import PublicPricingPage from "@pages/public/PricingPage";
import FeaturesPage from "@pages/public/FeaturesPage";
import { PublicCmsPage } from "@pages/public/PublicCmsPage";
import CookiePolicyPage from "@pages/public/CookiePolicy";
import DataDeletionPage from "@pages/public/DataDeletion";
import PrivacyPolicyPage from "@pages/public/PrivacyPolicy";
import TermsOfServicePage from "@pages/public/TermsOfService";
import AcademyDocsPage from "@pages/public/AcademyDocsPage";
import EmployeeLoginPage from "@modules/crm/pages/EmployeeLogin";
import EmployeeResetPasswordPage from "@modules/crm/pages/EmployeeResetPassword";


export function publicRoutes() {
  return (
    <>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<PublicCmsPage slug="about" />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
      <Route path="/cookie-policy" element={<CookiePolicyPage />} />
      <Route path="/data-deletion" element={<DataDeletionPage />} />
      <Route path="/help-center" element={<HelpCenterPage />} />
      <Route path="/help-center/ticket" element={<RaiseTicketPage />} />
      <Route path="/careers" element={<CareersPage />} />
      <Route path="/pricing" element={<PublicPricingPage />} />
      <Route path="/academy" element={<AcademyDocsPage />} />
      <Route path="/academy/:categorySlug/:articleSlug" element={<AcademyDocsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
      <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
      <Route path="/employee/login" element={<EmployeeLoginPage />} />
      <Route path="/employee/reset-password" element={<EmployeeResetPasswordPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </>
  );
}
