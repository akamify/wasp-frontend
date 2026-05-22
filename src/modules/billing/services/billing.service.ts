import { API } from "@api/api";

export const billingService = {
  listPlans: () => API.billing.plans(),
  current: () => API.billing.current(),
};

