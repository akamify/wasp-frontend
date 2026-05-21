import { employeeApi } from "@modules/crm/services/employeeApi";
import { getEmployeeToken, setEmployeeToken } from "@modules/crm/services/employeeAuthStorage";

function unwrap(res: any) {
  return res?.data?.body || res?.data;
}

employeeApi.interceptors.request.use((config) => {
  const token = getEmployeeToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

employeeApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) setEmployeeToken("");
    throw err;
  }
);

export const crmEmployeeInboxService = {
  conversations: {
    list: (params: { limit?: number; search?: string }) =>
      employeeApi.get("/crm/employee/conversations", { params }).then(unwrap),
    get: (phone: string) => employeeApi.get(`/crm/employee/conversations/${encodeURIComponent(phone)}`).then(unwrap),
    read: (phone: string) => employeeApi.post(`/crm/employee/conversations/${encodeURIComponent(phone)}/read`).then(unwrap),
  },
  messages: {
    byPhone: (phone: string) => employeeApi.get(`/crm/employee/messages/${encodeURIComponent(phone)}`).then(unwrap),
    sendText: (payload: { to: string; text: string }) => employeeApi.post("/crm/employee/messages/send-text", payload).then(unwrap),
    sendMedia: (payload: { to: string; type: string; mediaId?: string; link?: string; caption?: string; filename?: string }) =>
      employeeApi.post("/crm/employee/messages/send-media", payload).then(unwrap),
    uploadMedia: (file: File, onProgress?: (pct: number) => void) => {
      const data = new FormData();
      data.append("file", file);
      return employeeApi
        .post("/crm/employee/messages/media", data, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (!onProgress) return;
            const total = e.total || 0;
            const loaded = e.loaded || 0;
            onProgress(total ? Math.round((loaded / total) * 100) : 0);
          },
        })
        .then(unwrap);
    },
    downloadMedia: (id: string) =>
      employeeApi.get(`/crm/employee/messages/media/${encodeURIComponent(id)}`, { responseType: "blob" }).then((r) => r.data),
  },
  realtime: {
    streamUrl: () => `${String(employeeApi.defaults.baseURL || "").replace(/\/+$/, "")}/crm/employee/realtime/stream`,
  },
};
