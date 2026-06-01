import { Route } from "react-router-dom";
import type { ReactNode } from "react";
import { RequireUser } from "@components/auth/RequireUser";
import { AppShell } from "@components/layout/AppShell";
import { RequireCrm } from "@modules/crm/components/RequireCrm";
import CrmDashboardPage from "@modules/crm/pages/CrmDashboard";
import CrmEmployeesPage from "@modules/crm/pages/CrmEmployees";
import CrmEmployeeProfilePage from "@modules/crm/pages/CrmEmployeeProfile";
import CrmLeadsPage from "@modules/crm/pages/CrmLeads";
import CrmSettingsPage from "@modules/crm/pages/CrmSettings";
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
import WorkspacesPage from "@pages/user/pages/Workspaces";

function inApp(page: ReactNode) {
  return <AppShell>{page}</AppShell>;
}

export function userRoutes() {
  return (
    <Route element={<RequireUser />}>
      <Route path="/app" element={inApp(<DashboardPage />)} />
      <Route path="/app/meta" element={inApp(<MetaConnectPage />)} />
      <Route path="/app/templates" element={inApp(<TemplatesPage />)} />
      <Route path="/app/send" element={inApp(<SendPage />)} />
      <Route path="/app/send/:id" element={inApp(<CampaignDetailPage />)} />
      <Route path="/app/contacts" element={inApp(<ContactsPage />)} />
      <Route path="/app/conversations/:phone?" element={inApp(<ConversationsPage />)} />
      <Route element={<RequireCrm />}>
        <Route path="/app/crm" element={inApp(<CrmDashboardPage />)} />
        <Route path="/app/crm/employees" element={inApp(<CrmEmployeesPage />)} />
        <Route path="/app/crm/employees/:employeeId" element={inApp(<CrmEmployeeProfilePage />)} />
        <Route path="/app/crm/leads" element={inApp(<CrmLeadsPage />)} />
        <Route path="/app/crm/settings" element={inApp(<CrmSettingsPage />)} />
      </Route>
      <Route path="/app/links" element={inApp(<LinksPage />)} />
      <Route path="/app/automation" element={inApp(<AutomationPage />)} />
      <Route path="/app/settings" element={inApp(<SettingsPage />)} />
      <Route path="/app/profile" element={inApp(<ProfilePage />)} />
      <Route path="/app/plan" element={inApp(<PlanPage />)} />
      <Route path="/app/plan/history" element={inApp(<PlanHistoryPage />)} />
      <Route path="/app/api-keys" element={inApp(<ApiKeysPage />)} />
      <Route path="/app/api-reports" element={inApp(<ApiReportsPage />)} />
      <Route path="/app/activity" element={inApp(<ActivityPage />)} />
      <Route path="/app/wallet" element={inApp(<WalletPage />)} />
      <Route path="/app/pricing" element={inApp(<PricingPage />)} />
      <Route path="/app/flows" element={inApp(<FlowsPage />)} />
      <Route path="/app/flows/create" element={inApp(<FlowsCreatePage />)} />
      <Route path="/workspaces" element={<WorkspacesPage />} />
    </Route>
  );
}
