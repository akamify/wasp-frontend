import { Navigate, Route } from "react-router-dom";
import { RequireEmployee } from "@modules/crm/components/RequireEmployee";
import { EmployeeShell } from "@modules/crm/components/EmployeeShell";
import EmployeeInboxPage from "@modules/crm/pages/EmployeeInbox";
import EmployeeProfilePage from "@modules/crm/pages/EmployeeProfile";
import EmployeeLeadsPage from "@modules/crm/pages/EmployeeLeads";

export function employeeRoutes() {
  return (
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
  );
}
