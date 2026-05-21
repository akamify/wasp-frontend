import { employeeApi } from "@modules/crm/services/employeeApi";

function unwrap(res: any) {
  return res?.data?.body || res?.data;
}

export const crmEmployeeProfileRequestsService = {
  list: () => employeeApi.get("/crm/employee/profile-requests").then(unwrap),
  submit: (payload: { requestType: "change_name" | "change_email" | "password_reset"; requestedName?: string; requestedEmail?: string; reason?: string }) =>
    employeeApi.post("/crm/employee/profile-requests", payload).then(unwrap),
};

