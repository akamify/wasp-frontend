import axios from "axios";

const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const isBrowser = typeof window !== "undefined";
const isLocalHost =
  isBrowser &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_BASE_URL = envBaseUrl || (isLocalHost ? "http://localhost:3000" : "/api");
const isDev = Boolean(import.meta.env.DEV);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

const TOKEN_KEY = "waspakamify_token";
const WORKSPACE_KEY = "waspakamify_workspace_id";

// Coalesce duplicate GET requests and add a tiny cache window to prevent
// UI-driven bursts from hammering the backend (and triggering rate limits).
const __getInflight = new Map();
const __getCache = new Map();
const DEFAULT_GET_CACHE_TTL_MS = 1500;

function stableStringify(value) {
  try {
    if (!value || typeof value !== "object") return String(value ?? "");
    const seen = new WeakSet();
    const sorter = (obj) => {
      if (!obj || typeof obj !== "object") return obj;
      if (seen.has(obj)) return "[Circular]";
      seen.add(obj);
      if (Array.isArray(obj)) return obj.map(sorter);
      const out = {};
      Object.keys(obj)
        .sort()
        .forEach((k) => {
          const v = obj[k];
          if (v === undefined) return;
          out[k] = sorter(v);
        });
      return out;
    };
    return JSON.stringify(sorter(value));
  } catch {
    return "";
  }
}

function buildGetKey(config) {
  const method = String(config?.method || "get").toLowerCase();
  const baseURL = String(config?.baseURL || API_BASE_URL || "");
  const url = String(config?.url || "");
  const params = stableStringify(config?.params || null);
  // Key also varies by auth/workspace to avoid cross-user leakage.
  const token = getToken();
  const workspaceId = getWorkspaceId();
  return [method, baseURL, url, params, token, workspaceId].join("|");
}

const __rawRequest = api.request.bind(api);
api.request = (config) => {
  const method = String(config?.method || "get").toLowerCase();
  if (method !== "get") return __rawRequest(config);

  const key = buildGetKey(config);
  const now = Date.now();
  const ttlMs =
    typeof config?.cacheTtlMs === "number" ? config.cacheTtlMs : DEFAULT_GET_CACHE_TTL_MS;

  const cached = __getCache.get(key);
  if (cached && cached.expiresAt > now) return Promise.resolve(cached.response);

  const inflight = __getInflight.get(key);
  if (inflight) return inflight;

  const p = __rawRequest(config)
    .then((res) => {
      __getInflight.delete(key);
      // If server responds 304 (no body), prefer the last cached 200 response.
      if (res?.status === 304) {
        const cached304 = __getCache.get(key);
        if (cached304 && cached304.expiresAt > now) return cached304.response;
      }
      if (ttlMs > 0) __getCache.set(key, { expiresAt: Date.now() + ttlMs, response: res });
      return res;
    })
    .catch((err) => {
      __getInflight.delete(key);
      throw err;
    });

  __getInflight.set(key, p);
  return p;
};

function workspaceFromToken(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length !== 3) return "";
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (String(payload?.role || "") === "admin" || String(payload?.role || "") === "super_admin") return "";
    return String(payload?.workspaceId || "");
  } catch {
    return "";
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getWorkspaceId() {
  return localStorage.getItem(WORKSPACE_KEY) || "";
}

export function setWorkspaceId(workspaceId) {
  if (!workspaceId) localStorage.removeItem(WORKSPACE_KEY);
  else localStorage.setItem(WORKSPACE_KEY, String(workspaceId));
}

export function setToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(WORKSPACE_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
  const workspaceId = workspaceFromToken(token);
  if (workspaceId) setWorkspaceId(workspaceId);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  const workspaceId = getWorkspaceId();
  if (workspaceId) {
    config.headers = config.headers || {};
    config.headers["x-workspace-id"] = workspaceId;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const backendMessage = String(err?.response?.data?.message || "").trim();
    const fallbackByStatus = {
      400: "Invalid request. Please check input and try again.",
      401: "Session expired. Please login again.",
      403: "You are not allowed to perform this action.",
      404: "Requested resource was not found.",
      409: "Conflict detected. Please refresh and try again.",
      422: "Submitted data is invalid.",
      429: "Rate limit hit. Please retry shortly.",
      500: "Something went wrong on server. Please try again.",
    };
    err.userMessage = isDev
      ? backendMessage || err?.message || "Request failed"
      : backendMessage || fallbackByStatus[status] || "Request failed. Please try again.";

    if (status === 401) {
      // If the token is invalid/expired, clear it so the UI can re-auth cleanly.
      setToken("");
    }
    if (status === 429) {
      const retryAfter =
        Number(err?.response?.headers?.["retry-after"]) ||
        Number(err?.response?.headers?.["x-ratelimit-reset-after"]) ||
        0;
      err.userMessage = retryAfter
        ? `Rate limit hit. Please retry in ~${Math.ceil(retryAfter)}s.`
        : "Rate limit hit. Please retry shortly.";
    }
    return Promise.reject(err);
  }
);

function unwrap(res) {
  return res.data;
}

export const API = {
  baseUrl: API_BASE_URL,

  auth: {
    register: (payload) => api.post("/auth/register", payload).then(unwrap),
    // Login can include OTP email dispatch in some flows; keep a higher timeout.
    login: (payload) => api.post("/auth/login", payload, { timeout: 60000 }).then(unwrap),
    verifyLoginOtp: (payload) => api.post("/auth/login/verify-otp", payload).then(unwrap),
    resendLoginOtp: (payload) => api.post("/auth/login/resend-otp", payload).then(unwrap),
    verifyRegisterOtp: (payload) => api.post("/auth/register/verify-otp", payload).then(unwrap),
    resendRegisterOtp: (payload) => api.post("/auth/register/resend-otp", payload).then(unwrap),
    forgotPassword: (payload) => api.post("/auth/forgot-password", payload).then(unwrap),
    resetPassword: (payload) => api.post("/auth/reset-password", payload).then(unwrap),
    adminForgotPassword: (payload) => api.post("/auth/admin/forgot-password", payload).then(unwrap),
    adminResetPassword: (payload) => api.post("/auth/admin/reset-password", payload).then(unwrap),
    me: () => api.get("/auth/me").then(unwrap),
    apiKeyStatus: () => api.get("/auth/api-key").then(unwrap),
    listApiKeys: () => api.get("/api-keys").then(unwrap),
    generateApiKey: (payload) => api.post("/api-keys/generate", payload || {}).then(unwrap),
    regenerateApiKey: (payload) => api.post("/api-keys/regenerate", payload || {}).then(unwrap),
    deleteApiKey: (id) => api.delete(`/api-keys/${encodeURIComponent(id)}`).then(unwrap),
    requestApiKeyOtp: (payload) => api.post("/auth/api-key/request-otp", payload).then(unwrap),
    verifyApiKeyOtp: (payload) => api.post("/auth/api-key/verify-otp", payload).then(unwrap),
    updateProfile: (payload) => api.put("/auth/profile", payload).then(unwrap),
    requestProfileOtp: (payload) => api.post("/auth/profile/request-otp", payload).then(unwrap),
    verifyProfileOtp: (payload) => api.post("/auth/profile/verify-otp", payload).then(unwrap),
    changePassword: (payload) => api.post("/auth/change-password", payload).then(unwrap),
    requestEnable2fa: () => api.post("/auth/2fa/request-enable").then(unwrap),
    verifyEnable2fa: (payload) => api.post("/auth/2fa/verify-enable", payload).then(unwrap),
    disable2fa: () => api.post("/auth/2fa/disable").then(unwrap),
    logout: () => api.post("/auth/logout").then(unwrap),
  },

  admin: { 
    overview: (params) => api.get("/admin/overview", { params }).then(unwrap),
    users: (params) => api.get("/admin/users", { params }).then(unwrap),
    updateUserStatus: (id, payload) => api.patch(`/admin/users/${encodeURIComponent(id)}/status`, payload || {}).then(unwrap),
    userApiKeys: (id) => api.get(`/api-keys/admin/users/${encodeURIComponent(id)}`).then(unwrap),
    sendChatAccessOtp: (id) => api.post(`/admin/users/${encodeURIComponent(id)}/chat-access/send-otp`, {}).then(unwrap),
    verifyChatAccessOtp: (id, payload) => api.post(`/admin/users/${encodeURIComponent(id)}/chat-access/verify-otp`, payload).then(unwrap),
    enableChatAccess: (id) => api.patch(`/admin/users/${encodeURIComponent(id)}/chat-access/enable`, {}).then(unwrap),
    disableChatAccess: (id) => api.patch(`/admin/users/${encodeURIComponent(id)}/chat-access/disable`, {}).then(unwrap),
    enableCampaignSendAccess: (id) => api.patch(`/admin/users/${encodeURIComponent(id)}/api-permissions/campaign-send/enable`, {}).then(unwrap),
    disableCampaignSendAccess: (id) => api.patch(`/admin/users/${encodeURIComponent(id)}/api-permissions/campaign-send/disable`, {}).then(unwrap),
    disableUserApiKey: (id, keyId) => api.patch(`/admin/users/${encodeURIComponent(id)}/api-keys/${encodeURIComponent(keyId)}/disable`, {}).then(unwrap),
    enableUserApiKey: (id, keyId) => api.patch(`/admin/users/${encodeURIComponent(id)}/api-keys/${encodeURIComponent(keyId)}/enable`, {}).then(unwrap),
    blockUser: (id) => api.patch(`/admin/users/${encodeURIComponent(id)}/block`, {}).then(unwrap),
    unblockUser: (id) => api.patch(`/admin/users/${encodeURIComponent(id)}/unblock`, {}).then(unwrap),
    channels: (params) => api.get("/admin/channels", { params }).then(unwrap),
    workspaces: (params) => api.get("/admin/workspaces", { params }).then(unwrap),
    masterCampaigns: (params) => api.get("/admin/master-campaigns", { params }).then(unwrap),
    masterTemplates: (params) => api.get("/admin/master-templates", { params }).then(unwrap),
    masterTemplateGet: (id) => api.get(`/admin/master-templates/${encodeURIComponent(id)}`).then(unwrap),
    masterTemplateUpdate: (id, payload) => api.put(`/admin/master-templates/${encodeURIComponent(id)}`, payload).then(unwrap),
    masterTemplateDelete: (id) => api.delete(`/admin/master-templates/${encodeURIComponent(id)}`).then(unwrap),
    masterTemplateSyncStatus: (id) => api.post(`/admin/master-templates/${encodeURIComponent(id)}/sync-status`, null).then(unwrap),
    masterTemplateSyncMeta: (payload) => api.post(`/admin/master-templates/sync-meta`, payload).then(unwrap),
    masterContacts: (params) => api.get("/admin/master-contacts", { params }).then(unwrap),
    notifications: (params) => api.get("/admin/notifications", { params }).then(unwrap),
    subscriptionPlans: () => api.get("/admin/subscription-plans").then(unwrap),
    subscriptionsData: (params) => api.get("/admin/subscriptions-data", { params }).then(unwrap),
    subscriptionWorkspaceOverview: (workspaceId) =>
      api.get(`/admin/subscriptions-data/${encodeURIComponent(workspaceId)}/overview`).then(unwrap),
    subscriptionWorkspaceHistory: (workspaceId, params) =>
      api.get(`/admin/subscriptions-data/${encodeURIComponent(workspaceId)}/history`, { params }).then(unwrap),
    subscriptionWorkspacePaymentLinks: (workspaceId, params) =>
      api.get(`/admin/subscriptions-data/${encodeURIComponent(workspaceId)}/payment-links`, { params }).then(unwrap),
    assignWorkspacePlan: (workspaceId, payload) =>
      api.post(`/admin/subscriptions-data/${encodeURIComponent(workspaceId)}/assign-plan`, payload || {}).then(unwrap),
    disableActiveWorkspacePlan: (workspaceId) =>
      api.post(`/admin/subscriptions-data/${encodeURIComponent(workspaceId)}/disable-active-plan`, {}).then(unwrap),
    createWorkspacePaymentLink: (workspaceId, payload) =>
      api.post(`/admin/subscriptions-data/${encodeURIComponent(workspaceId)}/payment-links`, payload || {}).then(unwrap),
    cancelWorkspacePaymentLink: (id) =>
      api.patch(`/admin/subscriptions-data/payment-links/${encodeURIComponent(id)}/cancel`, {}).then(unwrap),
    transactionsLogs: (params) => api.get("/admin/transactions-logs", { params }).then(unwrap),
    messageLogs: (params) => api.get("/admin/message-logs", { params }).then(unwrap),
    paymentGateway: (params) => api.get("/admin/payment-gateway", { params }).then(unwrap),
    supportTickets: (params) => api.get("/admin/support-tickets", { params }).then(unwrap),
    resolveSupportTicket: (id, payload) => api.patch(`/admin/support-tickets/${id}/resolve`, payload || {}).then(unwrap),
    appUpdate: () => api.get("/admin/app-update").then(unwrap),
    changePassword: (payload) => api.put("/admin/settings/password", payload).then(unwrap),

    profile: () => api.get("/admin/profile").then(unwrap),
    profileUpdate: (payload) => api.put("/admin/profile", payload).then(unwrap),
    profileLogins: (params) => api.get("/admin/profile/logins", { params }).then(unwrap),
    profileRequests: (params) => api.get("/admin/profile/requests", { params }).then(unwrap),
    createProfileRequest: (payload) => api.post("/admin/profile/requests", payload).then(unwrap),
    verifyProfileRequestOtp: (requestId, payload) =>
      api.post(`/admin/profile/requests/${encodeURIComponent(requestId)}/verify-otp`, payload || {}).then(unwrap),
    resendProfileRequestOtp: (requestId) =>
      api.post(`/admin/profile/requests/${encodeURIComponent(requestId)}/resend-otp`, {}).then(unwrap),

    pages: () => api.get("/admin/pages").then(unwrap),
    pageGet: (slug) => api.get(`/admin/pages/${encodeURIComponent(slug)}`).then(unwrap),
    pageUpsert: (slug, payload) => api.put(`/admin/pages/${encodeURIComponent(slug)}`, payload).then(unwrap),
    platformBrandGet: () => api.get("/admin/platform-brand").then(unwrap),
    platformBrandUpdate: (payload) => api.put("/admin/platform-brand", payload).then(unwrap),
    platformBrandUploadLogo: (file, onProgress) => {
      const data = new FormData();
      data.append("file", file);
      return api
        .post("/admin/platform-brand/upload-logo", data, {
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

    careerApplications: (params) => api.get("/admin/career-applications", { params }).then(unwrap),
    updateCareerApplication: (id, payload) => api.patch(`/admin/career-applications/${id}`, payload).then(unwrap),
    downloadCareerResume: (id) => 
      api.get(`/admin/career-applications/${id}/resume`, { responseType: "blob" }).then((r) => r.data), 

    crmWorkspace: (workspaceId) => api.get(`/admin/crm/workspaces/${encodeURIComponent(workspaceId)}`).then(unwrap),
    crmSetEnabled: (workspaceId, enabled) =>
      api.patch(`/admin/crm/workspaces/${encodeURIComponent(workspaceId)}/enabled`, { enabled: !!enabled }).then(unwrap),
    crmSetLeadWindowHours: (workspaceId, leadWindowHours) =>
      api.put(`/admin/crm/workspaces/${encodeURIComponent(workspaceId)}/settings/lead-window`, { leadWindowHours }).then(unwrap),
    crmEmployees: (workspaceId) => api.get(`/admin/crm/workspaces/${encodeURIComponent(workspaceId)}/employees`).then(unwrap),
    crmCreateEmployee: (workspaceId, payload) =>
      api.post(`/admin/crm/workspaces/${encodeURIComponent(workspaceId)}/employees`, payload).then(unwrap),

    setWorkspaceExternalChatFeature: (workspaceId, enabled) =>
      api
        .patch(`/admin/workspaces/${encodeURIComponent(workspaceId)}/features/external-chat`, { enabled: !!enabled })
        .then(unwrap),
    getWorkspaceExternalChatFeature: (workspaceId) =>
      api
        .get(`/admin/workspaces/${encodeURIComponent(workspaceId)}/features/external-chat`)
        .then(unwrap),
    setApiKeyChatAccess: (userId, keyId, enabled) =>
      api
        .patch(`/admin/users/${encodeURIComponent(userId)}/api-keys/${encodeURIComponent(keyId)}/permissions/chat-access`, { enabled: !!enabled })
        .then(unwrap),
    syncApiKeysChatAccess: (userId, enabled) =>
      api
        .post(`/admin/users/${encodeURIComponent(userId)}/api-keys/sync-chat-access`, { enabled: !!enabled })
        .then(unwrap),

    docsList: (params) => api.get("/admin/docs", { params }).then(unwrap),
    docsGet: (id) => api.get(`/admin/docs/${encodeURIComponent(id)}`).then(unwrap),
    docsCreate: (payload) => api.post("/admin/docs", payload).then(unwrap),
    docsUpdate: (id, payload) => api.put(`/admin/docs/${encodeURIComponent(id)}`, payload).then(unwrap),
    docsDelete: (id) => api.delete(`/admin/docs/${encodeURIComponent(id)}`).then(unwrap),
    docsBrandGet: () => api.get("/admin/docs-brand").then(unwrap),
    docsBrandUpdate: (payload) => api.put("/admin/docs-brand", payload).then(unwrap),
    docsBrandUploadLogo: (file, onProgress) => {
      const data = new FormData();
      data.append("file", file);
      return api
        .post("/admin/docs-brand/upload-logo", data, {
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
  }, 

  superAdmin: {
    profile: () => api.get("/super-admin/profile").then(unwrap),
    updateProfileName: (payload) => api.patch("/super-admin/profile/name", payload).then(unwrap),
    changeProfilePassword: (payload) => api.post("/super-admin/profile/change-password", payload).then(unwrap),
    requestProfileOtp: (payload) => api.post("/super-admin/profile/request-otp", payload).then(unwrap),
    verifyProfileOtp: (payload) => api.post("/super-admin/profile/verify-otp", payload).then(unwrap),
    setProfile2fa: (payload) => api.patch("/super-admin/profile/2fa", payload).then(unwrap),
    admins: (params) => api.get("/super-admin/admins", { params }).then(unwrap),
    adminDetail: (id) => api.get(`/super-admin/admins/${encodeURIComponent(id)}`).then(unwrap),
    updateAdmin: (id, payload) => api.patch(`/super-admin/admins/${encodeURIComponent(id)}`, payload || {}).then(unwrap),
    decideAdminProfileRequest: (adminId, requestId, payload) =>
      api.post(`/super-admin/admins/${encodeURIComponent(adminId)}/profile-requests/${encodeURIComponent(requestId)}/decision`, payload || {}).then(unwrap),
    assignAdmin: (payload) => api.post("/super-admin/admins/assign", payload).then(unwrap),
    removeAdmin: (payload) => api.post("/super-admin/admins/remove", payload).then(unwrap),
    suspendUser: (payload) => api.post("/super-admin/users/suspend", payload).then(unwrap),
    resetUserPassword: (payload) => api.post("/super-admin/users/reset-password", payload).then(unwrap),
    securityLogs: (params) => api.get("/super-admin/security-logs", { params }).then(unwrap),
    platformSettings: () => api.get("/super-admin/platform-settings").then(unwrap),
    platformSettingsByCategory: (category) => api.get(`/super-admin/platform-settings/${encodeURIComponent(category)}`).then(unwrap),
    updatePlatformSetting: (key, payload) => api.put(`/super-admin/platform-settings/${encodeURIComponent(key)}`, payload || {}).then(unwrap),
    bulkUpdatePlatformSettings: (payload) => api.post("/super-admin/platform-settings/bulk", payload || {}).then(unwrap),
    testPlatformCategory: (category, payload) =>
      api.post(`/super-admin/platform-settings/${encodeURIComponent(category)}/test`, payload || {}).then(unwrap),
    platformAddons: () => api.get("/super-admin/platform-addons").then(unwrap),
    platformAddonsByCategory: (category) => api.get(`/super-admin/platform-addons/${encodeURIComponent(category)}`).then(unwrap),
    updatePlatformAddon: (key, payload) => api.put(`/super-admin/platform-addons/${encodeURIComponent(key)}`, payload || {}).then(unwrap),
    bulkUpdatePlatformAddons: (payload) => api.post("/super-admin/platform-addons/bulk", payload || {}).then(unwrap),
    billingPlans: (params) => api.get("/admin/billing/plans", { params }).then(unwrap),
    billingPlanGet: (id) => api.get(`/admin/billing/plans/${encodeURIComponent(id)}`).then(unwrap),
    billingPlanCreate: (payload) => api.post("/admin/billing/plans", payload || {}).then(unwrap),
    billingPlanUpdate: (id, payload) => api.put(`/admin/billing/plans/${encodeURIComponent(id)}`, payload || {}).then(unwrap),
    billingPlanReview: (id, payload) => api.post(`/admin/billing/plans/${encodeURIComponent(id)}/review`, payload || {}).then(unwrap),
    billingPlanPublish: (id, payload) => api.post(`/admin/billing/plans/${encodeURIComponent(id)}/publish`, payload || {}).then(unwrap),
    billingPlanDisable: (id) => api.patch(`/admin/billing/plans/${encodeURIComponent(id)}/disable`, {}).then(unwrap),
    billingSettingsGet: () => api.get("/admin/billing/settings").then(unwrap),
    billingSettingsUpdate: (payload) => api.put("/admin/billing/settings", payload || {}).then(unwrap),
    billingPricePreview: (payload) => api.post("/admin/billing/plans/price-preview", payload || {}).then(unwrap),
  },

  crm: {
    workspace: () => api.get("/crm/workspace").then(unwrap),
    dashboard: () => api.get("/crm/dashboard").then(unwrap),
    setLeadWindowHours: (leadWindowHours) =>
      api.put("/crm/settings/lead-window", { leadWindowHours }).then(unwrap),
    setAssignmentLockMinutes: (assignmentLockMinutes) =>
      api.put("/crm/settings/assignment-lock", { assignmentLockMinutes }).then(unwrap),
    setAssignmentMode: (payload) =>
      api.put("/crm/settings/assignment-mode", payload || {}).then(unwrap),
    setAssignmentSchedule: (payload) =>
      api.put("/crm/settings/assignment-schedule", payload || {}).then(unwrap),
    employees: () => api.get("/crm/employees").then(unwrap),
    createEmployee: (payload) => api.post("/crm/employees", payload).then(unwrap),
    updateEmployeeStatus: (employeeId, status) =>
      api.patch(`/crm/employees/${encodeURIComponent(employeeId)}/status`, { status }).then(unwrap),
    employeeProfile: (employeeId) =>
      api.get(`/crm/employees/${encodeURIComponent(employeeId)}/profile`).then(unwrap),
    updateEmployeeProfile: (employeeId, payload) =>
      api.patch(`/crm/employees/${encodeURIComponent(employeeId)}/profile`, payload || {}).then(unwrap),
    employeeLeads: (employeeId, params) =>
      api.get(`/crm/employees/${encodeURIComponent(employeeId)}/leads`, { params }).then(unwrap),
    employeeActivities: (employeeId, params) =>
      api.get(`/crm/employees/${encodeURIComponent(employeeId)}/activities`, { params }).then(unwrap),
    employeeSessions: (employeeId, params) =>
      api.get(`/crm/employees/${encodeURIComponent(employeeId)}/sessions`, { params }).then(unwrap),
    employeeRequests: (params) => api.get("/crm/employee-requests", { params }).then(unwrap),
    decideEmployeeRequest: (requestId, payload) =>
      api.post(`/crm/employee-requests/${encodeURIComponent(requestId)}/decide`, payload || {}).then(unwrap),
    verifyEmployeeEmailOtp: (employeeId, payload) =>
      api.post(`/crm/employees/${encodeURIComponent(employeeId)}/verify-email-otp`, payload || {}).then(unwrap),
    sendEmployeeResetLink: (employeeId) =>
      api.post(`/crm/employees/${encodeURIComponent(employeeId)}/send-reset-link`, {}).then(unwrap),
    resetEmployeePassword: (employeeId, payload) =>
      api.post(`/crm/employees/${encodeURIComponent(employeeId)}/reset-password`, payload || {}).then(unwrap),
    manualAssignLead: (phone, payload) =>
      api.post(`/crm/leads/${encodeURIComponent(phone)}/assign`, payload || {}).then(unwrap),
    conversationEvents: (phone, params) =>
      api.get(`/crm/conversations/${encodeURIComponent(phone)}/events`, { params }).then(unwrap),
  },

  public: {
    page: (slug) => api.get(`/public/pages/${encodeURIComponent(slug)}`).then(unwrap),
    platformBrandGet: () => api.get("/public/platform-brand").then(unwrap),
    createSupportTicket: (payload) => api.post("/public/support-tickets", payload).then(unwrap),
    applyCareer: (payload, file, onProgress) => {
      const data = new FormData();
      Object.entries(payload || {}).forEach(([k, v]) => data.append(k, String(v ?? "")));
      data.append("resume", file);
      return api
        .post("/public/careers/apply", data, {
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
  },

  workspaces: {
    list: () => api.get("/workspaces").then(unwrap),
    create: (payload) => api.post("/workspaces", payload).then(unwrap),
  },

  credentials: {
    getWhatsApp: () => api.get("/credentials/whatsapp").then(unwrap),
    upsertWhatsApp: (payload) => api.put("/credentials/whatsapp", payload).then(unwrap),
    deleteWhatsApp: () => api.delete("/credentials/whatsapp").then(unwrap),
  },

  templates: {
    list: (params) => api.get("/templates", { params }).then(unwrap),
    // Template submission can take > 20s due to Meta-side transient locks/backoff retries.
    create: (payload) => api.post("/templates", payload, { timeout: 180000 }).then(unwrap),
    get: (id) => api.get(`/templates/${id}`).then(unwrap),
    update: (id, payload) => api.put(`/templates/${id}`, payload).then(unwrap),
    remove: (id) => api.delete(`/templates/${id}`).then(unwrap),
    submit: (id) => api.post(`/templates/${id}/submit`, null, { timeout: 180000 }).then(unwrap),
    status: (id) => api.get(`/templates/${id}/status`).then(unwrap),
    syncMeta: (payload) => api.post("/templates/sync-meta", payload || {}).then(unwrap),
    uploadMedia: (file, onProgress) => {
      const data = new FormData();
      data.append("file", file);
      return api
        .post("/templates/media", data, {
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
    downloadMediaByHandle: (handle) =>
      api.get(`/templates/media/handle/${encodeURIComponent(handle)}`, { responseType: "blob" }).then((r) => r.data),
  },

  messages: {
    send: (payload) => api.post("/messages/send", payload).then(unwrap),
    sendText: (payload) => api.post("/messages/send-text", payload).then(unwrap),
    sendMedia: (payload) => api.post("/messages/send-media", payload).then(unwrap),
    bulk: (payload) => api.post("/messages/bulk", payload).then(unwrap),
    logs: (params) => api.get("/messages/logs", { params }).then(unwrap),
    status: (waId) => api.get(`/messages/status/${encodeURIComponent(waId)}`).then(unwrap),
    byPhone: (phone, params) => api.get(`/messages/${phone}`, { params }).then(unwrap),
    downloadMedia: (id) => api.get(`/messages/media/${encodeURIComponent(id)}`, { responseType: "blob" }).then((r) => r.data),
    uploadMedia: (file, onProgress) => {
      const data = new FormData();
      data.append("file", file);
      return api
        .post("/messages/media", data, {
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
  },

  analytics: {
    overview: (params) => api.get("/analytics/overview", { params }).then(unwrap),
    template: (id) => api.get(`/analytics/template/${id}`).then(unwrap),
  },

  meta: {
    status: () => api.get("/meta/status").then(unwrap),
    subscriptionHealth: () => api.get("/meta/subscription-health").then(unwrap),
    save: (payload) => api.post("/meta/save", payload).then(unwrap),
    updateProfile: (payload) => api.put("/meta/profile", payload).then(unwrap),
    uploadProfilePicture: (file) => {
      const data = new FormData();
      data.append("file", file);
      return api.post("/meta/profile-picture", data, { headers: { "Content-Type": "multipart/form-data" } }).then(unwrap);
    },
    listFlows: (params) => api.get("/meta/flows", { params }).then(unwrap),
    createFlow: (payload) => api.post("/meta/flows", payload).then(unwrap),
    uploadFlowJson: (flowId, flowJson) => api.post(`/meta/flows/${encodeURIComponent(flowId)}/assets`, { flowJson }).then(unwrap),
    publishFlow: (flowId) => api.post(`/meta/flows/${encodeURIComponent(flowId)}/publish`).then(unwrap),
  },

  links: {
    create: (payload) => api.post("/links", payload).then(unwrap),
    tracked: {
      list: () => api.get("/links/tracked").then(unwrap),
      create: (payload) => api.post("/links/tracked", payload).then(unwrap),
      update: (id, payload) => api.put(`/links/tracked/${id}`, payload).then(unwrap),
      remove: (id) => api.delete(`/links/tracked/${id}`).then(unwrap),
      analytics: (id, params) => api.get(`/links/tracked/${id}/analytics`, { params }).then(unwrap),
      qrSvgUrl: (id) => `${API_BASE_URL}/links/tracked/${encodeURIComponent(id)}/qr.svg`,
      qrPngUrl: (id) => `${API_BASE_URL}/links/tracked/${encodeURIComponent(id)}/qr.png`,
    },
  },

  billing: {
    plans: () => api.get("/billing/plans").then(unwrap),
    current: () => api.get("/billing/current").then(unwrap),
    history: (params) => api.get("/billing/history", { params }).then(unwrap),
  },

  wallet: {
    get: () => api.get("/wallet").then(unwrap),
    createRechargeOrder: (payload) => api.post("/wallet/recharge/order", payload).then(unwrap),
    history: (params) => api.get("/wallet/history", { params }).then(unwrap),
  },

  campaigns: {
    list: (params) => api.get("/campaigns", { params }).then(unwrap),
    get: (id) => api.get(`/campaigns/${id}`).then(unwrap),
    estimate: (payload) => api.post("/campaigns/estimate", payload).then(unwrap),
    metrics: (id) => api.get(`/campaigns/${id}/metrics`).then(unwrap),
    messages: (id, params) => api.get(`/campaigns/${id}/messages`, { params }).then(unwrap),
    replies: (id, params) => api.get(`/campaigns/${id}/replies`, { params }).then(unwrap),
    creditUsage: (id) => api.get(`/campaigns/${id}/credit-usage`).then(unwrap),
    failedRecipients: (id) => api.get(`/campaigns/${id}/failed-recipients`).then(unwrap),
    retryFailed: (id) => api.post(`/campaigns/${id}/retry-failed`).then(unwrap),
    remove: (id, params) => api.delete(`/campaigns/${id}`, { params }).then(unwrap),
    action: (id, action) => api.post(`/campaigns/${id}/action`, { action }).then(unwrap),
    create: (payload) => api.post("/campaigns", payload).then(unwrap),
  },

  reports: {
    apiCampaigns: (params) => api.get("/reports/api-campaigns", { params }).then(unwrap),
    apiCampaign: (id) => api.get(`/reports/api-campaigns/${encodeURIComponent(id)}`).then(unwrap),
    apiMessages: (params) => api.get("/reports/api-messages", { params }).then(unwrap),
    apiMessage: (id) => api.get(`/reports/api-messages/${encodeURIComponent(id)}`).then(unwrap),
  },

  conversations: {
    list: (params) => api.get("/conversations", { params }).then(unwrap),
    get: (phone) => api.get(`/conversations/${phone}`).then(unwrap),
    read: (phone) => api.post(`/conversations/${phone}/read`).then(unwrap),
    clear: (phone) => api.delete(`/conversations/${phone}`).then(unwrap),
  },

  contacts: {
    list: (params) => api.get("/contacts", { params }).then(unwrap),
    get: (id) => api.get(`/contacts/${id}`).then(unwrap),
    lookupByPhone: (phone) => api.get(`/contacts/lookup/${phone}`).then(unwrap),
    create: (payload) => api.post("/contacts", payload).then(unwrap),
    update: (id, payload) => api.put(`/contacts/${id}`, payload).then(unwrap),
    remove: (id) => api.delete(`/contacts/${id}`).then(unwrap),
    exportCsv: (contactIds) =>
      api.post(
        "/contacts/export-csv",
        { contactIds: Array.isArray(contactIds) ? contactIds : [] },
        { responseType: "blob" }
      ),
  },

  automation: {
    triggerEvent: (payload) => api.post("/trigger-event", payload).then(unwrap),
  },
};
