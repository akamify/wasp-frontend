import axios from "axios";

const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const isBrowser = typeof window !== "undefined";
const isLocalHost =
  isBrowser &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_BASE_URL = envBaseUrl || (isLocalHost ? "http://localhost:3000" : "/api");

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
    login: (payload) => api.post("/auth/login", payload).then(unwrap),
    verifyLoginOtp: (payload) => api.post("/auth/login/verify-otp", payload).then(unwrap),
    resendLoginOtp: (payload) => api.post("/auth/login/resend-otp", payload).then(unwrap),
    verifyRegisterOtp: (payload) => api.post("/auth/register/verify-otp", payload).then(unwrap),
    resendRegisterOtp: (payload) => api.post("/auth/register/resend-otp", payload).then(unwrap),
    forgotPassword: (payload) => api.post("/auth/forgot-password", payload).then(unwrap),
    resetPassword: (payload) => api.post("/auth/reset-password", payload).then(unwrap),
    me: () => api.get("/auth/me").then(unwrap),
    apiKeyStatus: () => api.get("/auth/api-key").then(unwrap),
    requestApiKeyOtp: (payload) => api.post("/auth/api-key/request-otp", payload).then(unwrap),
    verifyApiKeyOtp: (payload) => api.post("/auth/api-key/verify-otp", payload).then(unwrap),
    updateProfile: (payload) => api.put("/auth/profile", payload).then(unwrap),
    changePassword: (payload) => api.post("/auth/change-password", payload).then(unwrap),
    requestEnable2fa: () => api.post("/auth/2fa/request-enable").then(unwrap),
    verifyEnable2fa: (payload) => api.post("/auth/2fa/verify-enable", payload).then(unwrap),
    disable2fa: () => api.post("/auth/2fa/disable").then(unwrap),
  },

  admin: {
    overview: () => api.get("/admin/overview").then(unwrap),
    users: () => api.get("/admin/users").then(unwrap),
    templates: () => api.get("/admin/templates").then(unwrap),
    credentials: () => api.get("/admin/credentials").then(unwrap),
    wallets: () => api.get("/admin/wallets").then(unwrap),
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
    overview: () => api.get("/analytics/overview").then(unwrap),
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
  },

  automation: {
    triggerEvent: (payload) => api.post("/trigger-event", payload).then(unwrap),
  },
};
