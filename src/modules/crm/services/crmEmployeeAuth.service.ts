import { employeeApi } from "@modules/crm/services/employeeApi";

function unwrap(res: any) {
  return res?.data?.body || res?.data;
}

export const crmEmployeeAuthService = {
  login: (payload: { workspaceId: string; email: string; password: string }) =>
    employeeApi.post("/crm/employee/login", payload).then(unwrap),
  resetPassword: (payload: { token: string; newPassword: string }) =>
    employeeApi.post("/crm/employee/reset-password", payload).then(unwrap),
  logout: () => employeeApi.post("/crm/employee/logout", {}).then(unwrap),
};
