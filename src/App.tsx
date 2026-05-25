import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@shared/providers/AuthContext";
import { RequireAdmin } from "@components/auth/RequireAdmin";
import { RequireSuperAdmin } from "@components/auth/RequireSuperAdmin";
import { RequireUser } from "@components/auth/RequireUser";
import { AppShell } from "@components/layout/AppShell";
import { AdminShell } from "@components/layout/AdminShell";
import { ToastProvider } from "@shared/providers/ToastContext";
import { EmployeeAuthProvider } from "@modules/crm/providers/EmployeeAuthContext";
import { RequireEmployee } from "@modules/crm/components/RequireEmployee";
import { EmployeeShell } from "@modules/crm/components/EmployeeShell";
import { RequireCrm } from "@modules/crm/components/RequireCrm";
import EmployeeLoginPage from "@modules/crm/pages/EmployeeLogin";
import EmployeeResetPasswordPage from "@modules/crm/pages/EmployeeResetPassword";
import EmployeeInboxPage from "@modules/crm/pages/EmployeeInbox";
import EmployeeProfilePage from "@modules/crm/pages/EmployeeProfile";
import EmployeeLeadsPage from "@modules/crm/pages/EmployeeLeads";
import CrmDashboardPage from "@modules/crm/pages/CrmDashboard";
import CrmEmployeesPage from "@modules/crm/pages/CrmEmployees";
import CrmEmployeeProfilePage from "@modules/crm/pages/CrmEmployeeProfile";
import CrmLeadsPage from "@modules/crm/pages/CrmLeads";
import CrmSettingsPage from "@modules/crm/pages/CrmSettings";

import LandingPage from "@pages/Landing";
import LoginPage from "@pages/auth/pages/Login";
import RegisterPage from "@pages/auth/pages/Register";
import ForgotPasswordPage from "@pages/auth/pages/ForgotPassword";
import ResetPasswordPage from "@pages/auth/pages/ResetPassword";
import AdminForgotPasswordPage from "@pages/auth/pages/AdminForgotPassword";
import AdminResetPasswordPage from "@pages/auth/pages/AdminResetPassword";
import DashboardPage from "@pages/user/pages/Dashboard";
import MetaConnectPage from "@pages/user/pages/Meta";
import TemplatesPage from "@pages/user/pages/Templates";
import SendPage from "@pages/user/pages/Send";
import CampaignDetailPage from "@pages/user/pages/CampaignDetail";
import ContactsPage from "@pages/user/pages/Contacts";
import ConversationsPage from "@pages/user/pages/Conversations";
import LinksPage from "@pages/user/pages/Links";
import AutomationPage from "@pages/user/pages/Automation";
import SettingsPage from "@pages/user/pages/Settings";
import ProfilePage from "@pages/user/pages/ProfilePage";
import PlanPage from "@pages/user/pages/Plan";
import PlanHistoryPage from "@pages/user/pages/PlanHistory";
import ApiKeysPage from "@pages/user/pages/ApiKeys";
import ApiReportsPage from "@pages/user/pages/ApiReports";
import ActivityPage from "@pages/user/pages/Activity";
import PricingPage from "@pages/user/pages/Pricing";
import WalletPage from "@pages/user/pages/Wallet";
import FlowsPage from "@pages/user/pages/Flows";
import FlowsCreatePage from "@pages/user/pages/FlowsCreate";
import NotFoundPage from "@pages/NotFound";
import HelpCenterPage from "@pages/public/HelpCenter";
import RaiseTicketPage from "@pages/public/RaiseTicket";
import CareersPage from "@pages/public/Careers";
import { PublicCmsPage } from "@pages/public/PublicCmsPage";
import AdminDashboardPage from "@pages/admin/pages/AdminDashboard";
import AdminUsersPage from "@pages/admin/pages/AdminUsers";
import AdminChannelsPage from "@pages/admin/pages/AdminChannels";
import AdminMasterCampaignsPage from "@pages/admin/pages/AdminMasterCampaigns";
import AdminMasterTemplatesPage from "@pages/admin/pages/AdminMasterTemplates";
import AdminMasterContactsPage from "@pages/admin/pages/AdminMasterContacts";
import AdminAnalyticsPage from "@pages/admin/pages/AdminAnalytics";
import AdminNotificationsPage from "@pages/admin/pages/AdminNotifications";
import AdminSubscriptionPlansPage from "@pages/admin/pages/AdminSubscriptionPlans";
import AdminSubscriptionsDataPage from "@pages/admin/pages/AdminSubscriptionsData";
import AdminTransactionsLogsPage from "@pages/admin/pages/AdminTransactionsLogs";
import AdminMessageLogsPage from "@pages/admin/pages/AdminMessageLogs";
import AdminPaymentGatewayPage from "@pages/admin/pages/AdminPaymentGateway";
import AdminSupportTicketsPage from "@pages/admin/pages/AdminSupportTickets";
import AdminAppUpdatePage from "@pages/admin/pages/AdminAppUpdate";
import AdminProfilePage from "@pages/admin/pages/AdminProfile";
import AdminPagesPage from "@pages/admin/pages/AdminPages";
import AdminCareerApplicationsPage from "@pages/admin/pages/AdminCareerApplications";
import AdminDocsPage from "@pages/admin/pages/AdminDocs";
import { SuperAdminShell } from "@pages/super-admin/components/SuperAdminShell";
import SuperAdminDashboardPage from "@pages/super-admin/pages/SuperAdminDashboard";
import SuperAdminAdminsListPage from "@pages/super-admin/pages/SuperAdminAdminsList";
import SuperAdminAdminDetailPage from "@pages/super-admin/pages/SuperAdminAdminDetail";
import SuperAdminAdminEditPage from "@pages/super-admin/pages/SuperAdminAdminEdit";
import SuperAdminProfilePage from "@pages/super-admin/pages/SuperAdminProfile";
import SuperAdminProfileEditPage from "@pages/super-admin/pages/SuperAdminProfileEdit";
import SuperAdminPlatformSettingsPage from "@pages/super-admin/pages/SuperAdminPlatformSettings";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <EmployeeAuthProvider>
        <Routes>
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
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
          <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
          <Route path="/employee/login" element={<EmployeeLoginPage />} />
          <Route path="/employee/reset-password" element={<EmployeeResetPasswordPage />} />

          <Route element={<RequireEmployee />}>
            <Route path="/employee" element={<Navigate to="/employee/inbox" replace />} />
            <Route
              path="/employee/inbox"
              element={
                <EmployeeShell>
                  <EmployeeInboxPage />
                </EmployeeShell>
              }
            />
            <Route
              path="/employee/inbox/:phone"
              element={
                <EmployeeShell>
                  <EmployeeInboxPage />
                </EmployeeShell>
              }
            />
            <Route
              path="/employee/profile"
              element={
                <EmployeeShell>
                  <EmployeeProfilePage />
                </EmployeeShell>
              }
            />
            <Route
              path="/employee/leads"
              element={
                <EmployeeShell>
                  <EmployeeLeadsPage />
                </EmployeeShell>
              }
            />
          </Route>

          <Route element={<RequireUser />}>
            <Route
              path="/app"
              element={
                <AppShell>
                  <DashboardPage />
                </AppShell>
              }
            />
            <Route
              path="/app/meta"
              element={
                <AppShell>
                  <MetaConnectPage />
                </AppShell>
              }
            />
            <Route
              path="/app/templates"
              element={
                <AppShell>
                  <TemplatesPage />
                </AppShell>
              }
            />
            <Route
              path="/app/send"
              element={
                <AppShell>
                  <SendPage />
                </AppShell>
              }
            />
            <Route
              path="/app/send/:id"
              element={
                <AppShell>
                  <CampaignDetailPage />
                </AppShell>
              }
            />
            <Route
              path="/app/contacts"
              element={
                <AppShell>
                  <ContactsPage />
                </AppShell>
              }
            />
            <Route
              path="/app/conversations/:phone?"
              element={
                <AppShell>
                  <ConversationsPage />
                </AppShell>
              }
            />
            <Route element={<RequireCrm />}>
              <Route
                path="/app/crm"
                element={
                  <AppShell>
                    <CrmDashboardPage />
                  </AppShell>
                }
              />
              <Route
                path="/app/crm/employees"
                element={
                  <AppShell>
                    <CrmEmployeesPage />
                  </AppShell>
                }
              />
              <Route
                path="/app/crm/employees/:employeeId"
                element={
                  <AppShell>
                    <CrmEmployeeProfilePage />
                  </AppShell>
                }
              />
              <Route
                path="/app/crm/leads"
                element={
                  <AppShell>
                    <CrmLeadsPage />
                  </AppShell>
                }
              />
              <Route
                path="/app/crm/settings"
                element={
                  <AppShell>
                    <CrmSettingsPage />
                  </AppShell>
                }
              />
            </Route>
            <Route
              path="/app/links"
              element={
                <AppShell>
                  <LinksPage />
                </AppShell>
              }
            />
            <Route
              path="/app/automation"
              element={
                <AppShell>
                  <AutomationPage />
                </AppShell>
              }
            />
            <Route
              path="/app/settings"
              element={
                <AppShell>
                  <SettingsPage />
                </AppShell>
              }
            />
            <Route
              path="/app/profile"
              element={
                <AppShell>
                  <ProfilePage />
                </AppShell>
              }
            />
            <Route
              path="/app/plan"
              element={
                <AppShell>
                  <PlanPage />
                </AppShell>
              }
            />
            <Route
              path="/app/plan/history"
              element={
                <AppShell>
                  <PlanHistoryPage />
                </AppShell>
              }
            />
            <Route
              path="/app/api-keys"
              element={
                <AppShell>
                  <ApiKeysPage />
                </AppShell>
              }
            />
            <Route
              path="/app/api-reports"
              element={
                <AppShell>
                  <ApiReportsPage />
                </AppShell>
              }
            />
            <Route
              path="/app/activity"
              element={
                <AppShell>
                  <ActivityPage />
                </AppShell>
              }
            />
            <Route
              path="/app/wallet"
              element={
                <AppShell>
                  <WalletPage />
                </AppShell>
              }
            />
            <Route
              path="/app/pricing"
              element={
                <AppShell>
                  <PricingPage />
                </AppShell>
              }
            />
            <Route
              path="/app/flows"
              element={
                <AppShell>
                  <FlowsPage />
                </AppShell>
              }
            />
            <Route
              path="/app/flows/create"
              element={
                <AppShell>
                  <FlowsCreatePage />
                </AppShell>
              }
            />
          </Route>

          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/channels" element={<Navigate to="/admin/workspaces" replace />} />
            <Route
              path="/admin/dashboard"
              element={
                <AdminShell>
                  <AdminDashboardPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <AdminShell>
                  <AdminProfilePage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminShell>
                  <AdminUsersPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/workspaces"
              element={
                <AdminShell>
                  <AdminChannelsPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/master-campaigns"
              element={
                <AdminShell>
                  <AdminMasterCampaignsPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/master-templates"
              element={
                <AdminShell>
                  <AdminMasterTemplatesPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/master-contacts"
              element={
                <AdminShell>
                  <AdminMasterContactsPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminShell>
                  <AdminAnalyticsPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <AdminShell>
                  <AdminNotificationsPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/subscriptions-data"
              element={
                <AdminShell>
                  <AdminSubscriptionsDataPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/subscriptions-data/:workspaceId"
              element={
                <AdminShell>
                  <AdminSubscriptionsDataPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/transactions-logs"
              element={
                <AdminShell>
                  <AdminTransactionsLogsPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/message-logs"
              element={
                <AdminShell>
                  <AdminMessageLogsPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/payment-gateway"
              element={
                <AdminShell>
                  <AdminPaymentGatewayPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/support-tickets"
              element={
                <AdminShell>
                  <AdminSupportTicketsPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/pages"
              element={
                <AdminShell>
                  <AdminPagesPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/career-applications"
              element={
                <AdminShell>
                  <AdminCareerApplicationsPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/app-update"
              element={
                <AdminShell>
                  <AdminAppUpdatePage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/docs"
              element={
                <AdminShell>
                  <AdminDocsPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/docs/create"
              element={
                <AdminShell>
                  <AdminDocsPage />
                </AdminShell>
              }
            />
            <Route
              path="/admin/docs/:id/edit"
              element={
                <AdminShell>
                  <AdminDocsPage />
                </AdminShell>
              }
            />
          </Route>

          <Route element={<RequireSuperAdmin />}>
            <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route
              path="/super-admin/dashboard"
              element={
                <SuperAdminShell>
                  <SuperAdminDashboardPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/admins"
              element={
                <SuperAdminShell>
                  <SuperAdminAdminsListPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/admins/:id"
              element={
                <SuperAdminShell>
                  <SuperAdminAdminDetailPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/admins/:id/:tab"
              element={
                <SuperAdminShell>
                  <SuperAdminAdminDetailPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/admins/:id/edit"
              element={
                <SuperAdminShell>
                  <SuperAdminAdminEditPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/profile"
              element={
                <SuperAdminShell>
                  <SuperAdminProfilePage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/profile/edit"
              element={
                <SuperAdminShell>
                  <SuperAdminProfileEditPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/platform-settings"
              element={
                <SuperAdminShell>
                  <SuperAdminPlatformSettingsPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/users"
              element={
                <SuperAdminShell>
                  <AdminUsersPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/workspaces"
              element={
                <SuperAdminShell>
                  <AdminChannelsPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/master-campaigns"
              element={
                <SuperAdminShell>
                  <AdminMasterCampaignsPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/master-templates"
              element={
                <SuperAdminShell>
                  <AdminMasterTemplatesPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/master-contacts"
              element={
                <SuperAdminShell>
                  <AdminMasterContactsPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/analytics"
              element={
                <SuperAdminShell>
                  <AdminAnalyticsPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/notifications"
              element={
                <SuperAdminShell>
                  <AdminNotificationsPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/subscription-plans"
              element={
                <SuperAdminShell>
                  <AdminSubscriptionPlansPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/subscription-plans/create"
              element={
                <SuperAdminShell>
                  <AdminSubscriptionPlansPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/subscription-plans/:id"
              element={
                <SuperAdminShell>
                  <AdminSubscriptionPlansPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/subscription-plans/:id/edit"
              element={
                <SuperAdminShell>
                  <AdminSubscriptionPlansPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/subscription-plans/:id/review"
              element={
                <SuperAdminShell>
                  <AdminSubscriptionPlansPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/subscriptions-data"
              element={
                <SuperAdminShell>
                  <AdminSubscriptionsDataPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/subscriptions-data/:workspaceId"
              element={
                <SuperAdminShell>
                  <AdminSubscriptionsDataPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/transactions-logs"
              element={
                <SuperAdminShell>
                  <AdminTransactionsLogsPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/message-logs"
              element={
                <SuperAdminShell>
                  <AdminMessageLogsPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/pages"
              element={
                <SuperAdminShell>
                  <AdminPagesPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/support-tickets"
              element={
                <SuperAdminShell>
                  <AdminSupportTicketsPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/career-applications"
              element={
                <SuperAdminShell>
                  <AdminCareerApplicationsPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/docs"
              element={
                <SuperAdminShell>
                  <AdminDocsPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/docs/create"
              element={
                <SuperAdminShell>
                  <AdminDocsPage />
                </SuperAdminShell>
              }
            />
            <Route
              path="/super-admin/docs/:id/edit"
              element={
                <SuperAdminShell>
                  <AdminDocsPage />
                </SuperAdminShell>
              }
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </EmployeeAuthProvider>
      </ToastProvider>
    </AuthProvider>
  );
}


