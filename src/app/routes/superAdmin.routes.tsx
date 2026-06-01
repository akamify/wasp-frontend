import { Navigate, Route } from "react-router-dom";
import type { ReactNode } from "react";
import { RequireSuperAdmin } from "@components/auth/RequireSuperAdmin";
import { SuperAdminShell } from "@pages/super-admin/components/SuperAdminShell";
import SuperAdminDashboardPage from "@pages/super-admin/pages/SuperAdminDashboard";
import SuperAdminAdminsListPage from "@pages/super-admin/pages/SuperAdminAdminsList";
import SuperAdminAdminDetailPage from "@pages/super-admin/pages/SuperAdminAdminDetail";
import SuperAdminAdminEditPage from "@pages/super-admin/pages/SuperAdminAdminEdit";
import SuperAdminProfilePage from "@pages/super-admin/pages/SuperAdminProfile";
import SuperAdminProfileEditPage from "@pages/super-admin/pages/SuperAdminProfileEdit";
import SuperAdminPlatformSettingsPage from "@pages/super-admin/pages/SuperAdminPlatformSettings";
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
import AdminPagesPage from "@pages/admin/pages/AdminPages";
import AdminSupportTicketsPage from "@pages/admin/pages/AdminSupportTickets";
import AdminCareerApplicationsPage from "@pages/admin/pages/AdminCareerApplications";
import AdminDocsPage from "@pages/admin/pages/AdminDocs";

function inSuperAdmin(page: ReactNode) {
  return <SuperAdminShell>{page}</SuperAdminShell>;
}

export function superAdminRoutes() {
  return (
    <Route element={<RequireSuperAdmin />}>
      <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
      <Route path="/super-admin/dashboard" element={inSuperAdmin(<SuperAdminDashboardPage />)} />
      <Route path="/super-admin/admins" element={inSuperAdmin(<SuperAdminAdminsListPage />)} />
      <Route path="/super-admin/admins/:id" element={inSuperAdmin(<SuperAdminAdminDetailPage />)} />
      <Route path="/super-admin/admins/:id/:tab" element={inSuperAdmin(<SuperAdminAdminDetailPage />)} />
      <Route path="/super-admin/admins/:id/edit" element={inSuperAdmin(<SuperAdminAdminEditPage />)} />
      <Route path="/super-admin/profile" element={inSuperAdmin(<SuperAdminProfilePage />)} />
      <Route path="/super-admin/profile/edit" element={inSuperAdmin(<SuperAdminProfileEditPage />)} />
      <Route path="/super-admin/platform-settings" element={inSuperAdmin(<SuperAdminPlatformSettingsPage />)} />
      <Route path="/super-admin/users" element={inSuperAdmin(<AdminUsersPage />)} />
      <Route path="/super-admin/workspaces" element={inSuperAdmin(<AdminChannelsPage />)} />
      <Route path="/super-admin/workspaces/:workspaceId" element={inSuperAdmin(<AdminSubscriptionsDataPage />)} />
      <Route path="/super-admin/master-campaigns" element={inSuperAdmin(<AdminMasterCampaignsPage />)} />
      <Route path="/super-admin/master-templates" element={inSuperAdmin(<AdminMasterTemplatesPage />)} />
      <Route path="/super-admin/master-contacts" element={inSuperAdmin(<AdminMasterContactsPage />)} />
      <Route path="/super-admin/analytics" element={inSuperAdmin(<AdminAnalyticsPage />)} />
      <Route path="/super-admin/notifications" element={inSuperAdmin(<AdminNotificationsPage />)} />
      <Route path="/super-admin/subscription-plans" element={inSuperAdmin(<AdminSubscriptionPlansPage />)} />
      <Route path="/super-admin/subscription-plans/create" element={inSuperAdmin(<AdminSubscriptionPlansPage />)} />
      <Route path="/super-admin/subscription-plans/:id" element={inSuperAdmin(<AdminSubscriptionPlansPage />)} />
      <Route path="/super-admin/subscription-plans/:id/edit" element={inSuperAdmin(<AdminSubscriptionPlansPage />)} />
      <Route path="/super-admin/subscription-plans/:id/review" element={inSuperAdmin(<AdminSubscriptionPlansPage />)} />
      <Route path="/super-admin/subscriptions-data" element={inSuperAdmin(<AdminSubscriptionsDataPage />)} />
      <Route path="/super-admin/subscriptions-data/:workspaceId" element={inSuperAdmin(<AdminSubscriptionsDataPage />)} />
      <Route path="/super-admin/transactions-logs" element={inSuperAdmin(<AdminTransactionsLogsPage />)} />
      <Route path="/super-admin/message-logs" element={inSuperAdmin(<AdminMessageLogsPage />)} />
      <Route path="/super-admin/pages" element={inSuperAdmin(<AdminPagesPage />)} />
      <Route path="/super-admin/support-tickets" element={inSuperAdmin(<AdminSupportTicketsPage />)} />
      <Route path="/super-admin/career-applications" element={inSuperAdmin(<AdminCareerApplicationsPage />)} />
      <Route path="/super-admin/docs" element={inSuperAdmin(<AdminDocsPage />)} />
      <Route path="/super-admin/docs/create" element={inSuperAdmin(<AdminDocsPage />)} />
      <Route path="/super-admin/docs/:id/edit" element={inSuperAdmin(<AdminDocsPage />)} />
    </Route>
  );
}
