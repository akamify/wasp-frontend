import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RequireAdmin } from "./components/auth/RequireAdmin";
import { RequireUser } from "./components/auth/RequireUser";
import { AppShell } from "./components/layout/AppShell";
import { AdminShell } from "./components/layout/AdminShell";

import LandingPage from "./pages/Landing";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import DashboardPage from "./pages/Dashboard";
import MetaConnectPage from "./pages/Meta";
import TemplatesPage from "./pages/Templates";
import SendPage from "./pages/Send";
import ContactsPage from "./pages/Contacts";
import ConversationsPage from "./pages/Conversations";
import ConversationDetailPage from "./pages/ConversationDetail";
import LinksPage from "./pages/Links";
import AutomationPage from "./pages/Automation";
import SettingsPage from "./pages/Settings";
import WalletPage from "./pages/Wallet";
import FlowsPage from "./pages/Flows";
import NotFoundPage from "./pages/NotFound";
import AdminPage from "./pages/Admin";
import AdminLoginPage from "./pages/AdminLogin";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

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
            path="/app/contacts"
            element={
              <AppShell>
                <ContactsPage />
              </AppShell>
            }
          />
          <Route
            path="/app/conversations"
            element={
              <AppShell>
                <ConversationsPage />
              </AppShell>
            }
          />
          <Route
            path="/app/conversations/:phone"
            element={
              <AppShell>
                <ConversationDetailPage />
              </AppShell>
            }
          />
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
            path="/app/wallet"
            element={
              <AppShell>
                <WalletPage />
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
        </Route>

        <Route element={<RequireAdmin />}>
          <Route
            path="/admin"
            element={
              <AdminShell>
                <AdminPage />
              </AdminShell>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
