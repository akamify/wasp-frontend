import { Navigate, Route } from "react-router-dom";
import type { ReactNode } from "react";
import { RequireAdmin } from "@components/auth/RequireAdmin";
import { AdminShell } from "@components/layout/AdminShell";
import AdminDashboardPage from "@pages/admin/pages/AdminDashboard";
import AdminUsersPage from "@pages/admin/pages/AdminUsers";
import AdminChannelsPage from "@pages/admin/pages/AdminChannels";
import AdminMasterCampaignsPage from "@pages/admin/pages/AdminMasterCampaigns";
import AdminMasterTemplatesPage from "@pages/admin/pages/AdminMasterTemplates";
import AdminMasterContactsPage from "@pages/admin/pages/AdminMasterContacts";
import AdminAnalyticsPage from "@pages/admin/pages/AdminAnalytics";
import AdminNotificationsPage from "@pages/admin/pages/AdminNotifications";
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

function inAdmin(page: ReactNode) {
  return <AdminShell>{page}</AdminShell>;
}

export function AdminRoutes() {
  return (
    <Route element={<RequireAdmin />}>
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/channels" element={<Navigate to="/admin/workspaces" replace />} />
      <Route path="/admin/dashboard" element={inAdmin(<AdminDashboardPage />)} />
      <Route path="/admin/profile" element={inAdmin(<AdminProfilePage />)} />
      <Route path="/admin/users" element={inAdmin(<AdminUsersPage />)} />
      <Route path="/admin/workspaces" element={inAdmin(<AdminChannelsPage />)} />
      <Route path="/admin/master-campaigns" element={inAdmin(<AdminMasterCampaignsPage />)} />
      <Route path="/admin/master-templates" element={inAdmin(<AdminMasterTemplatesPage />)} />
      <Route path="/admin/master-contacts" element={inAdmin(<AdminMasterContactsPage />)} />
      <Route path="/admin/analytics" element={inAdmin(<AdminAnalyticsPage />)} />
      <Route path="/admin/notifications" element={inAdmin(<AdminNotificationsPage />)} />
      <Route path="/admin/subscriptions-data" element={inAdmin(<AdminSubscriptionsDataPage />)} />
      <Route path="/admin/subscriptions-data/:workspaceId" element={inAdmin(<AdminSubscriptionsDataPage />)} />
      <Route path="/admin/transactions-logs" element={inAdmin(<AdminTransactionsLogsPage />)} />
      <Route path="/admin/message-logs" element={inAdmin(<AdminMessageLogsPage />)} />
      <Route path="/admin/payment-gateway" element={inAdmin(<AdminPaymentGatewayPage />)} />
      <Route path="/admin/support-tickets" element={inAdmin(<AdminSupportTicketsPage />)} />
      <Route path="/admin/pages" element={inAdmin(<AdminPagesPage />)} />
      <Route path="/admin/career-applications" element={inAdmin(<AdminCareerApplicationsPage />)} />
      <Route path="/admin/app-update" element={inAdmin(<AdminAppUpdatePage />)} />
      <Route path="/admin/docs" element={inAdmin(<AdminDocsPage />)} />
      <Route path="/admin/docs/create" element={inAdmin(<AdminDocsPage />)} />
      <Route path="/admin/docs/:id/edit" element={inAdmin(<AdminDocsPage />)} />
    </Route>
  );
}
