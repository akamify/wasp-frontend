import { employeeApi } from "@modules/crm/services/employeeApi";

function unwrap(res: any) {
  return res?.data?.body || res?.data;
}

export const crmEmployeeLeadsService = {
  list: (params: { range?: "all" | "today" | "7d"; page?: number; limit?: number }) =>
    employeeApi.get("/crm/employee/leads", { params }).then(unwrap),
};

