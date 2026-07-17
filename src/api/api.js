import axios from "axios";
import { buildApiGroupAdmin } from "./groups/apiGroupAdmin";
import { buildApiGroupPrimary } from "./groups/apiGroupPrimary";
import { buildApiGroupSecondary } from "./groups/apiGroupSecondary";

const rawEnvBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const isBrowser = typeof window !== "undefined";
const isLocalHost =
  isBrowser &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

function normalizeApiBaseUrl(value) {
  const v = String(value || "").trim();
  if (!v || v === "/" || v === "./") return "";
  return v.replace(/\/+$/, "");
}

const envBaseUrl = normalizeApiBaseUrl(rawEnvBaseUrl);
const API_BASE_URL = envBaseUrl || (isLocalHost ? "http://localhost:3000" : "/api");
const isDev = Boolean(import.meta.env.DEV);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

export const TOKEN_KEY = "aiwizchat_token";
export const WORKSPACE_KEY = "aiwizchat_workspace_id";
export const AUTH_STORAGE_EVENT = "aiwizchat:auth-storage";
const LEGACY_TOKEN_KEYS = ["waspakamify_token"];
const LEGACY_WORKSPACE_KEYS = ["waspakamify_workspace_id"];
let __workspaceResolvePromise = null;

// Coalesce duplicate GET requests and add a tiny cache window to prevent
// UI-driven bursts from hammering the backend (and triggering rate limits).
const __getInflight = new Map();
const __getCache = new Map();
const DEFAULT_GET_CACHE_TTL_MS = 1500;

export function clearApiGetCache() {
  __getCache.clear();
}

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
  const current = localStorage.getItem(TOKEN_KEY);
  if (current) return current;
  for (const key of LEGACY_TOKEN_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy) return legacy;
  }
  return "";
}

export function getWorkspaceId() {
  const current = localStorage.getItem(WORKSPACE_KEY);
  if (current) return current;
  for (const key of LEGACY_WORKSPACE_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy) return legacy;
  }
  return "";
}

export function setWorkspaceId(workspaceId) {
  const previous = localStorage.getItem(WORKSPACE_KEY) || "";
  const next = String(workspaceId || "");
  if (!next) localStorage.removeItem(WORKSPACE_KEY);
  else localStorage.setItem(WORKSPACE_KEY, next);
  if (previous !== next) {
    __getCache.clear();
    __getInflight.clear();
    window.dispatchEvent(new CustomEvent(AUTH_STORAGE_EVENT, { detail: { key: WORKSPACE_KEY } }));
  }
}

export function setToken(token) {
  const previous = localStorage.getItem(TOKEN_KEY) || "";
  const next = String(token || "");
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(WORKSPACE_KEY);
    __getCache.clear();
    __getInflight.clear();
    if (previous) {
      window.dispatchEvent(new CustomEvent(AUTH_STORAGE_EVENT, { detail: { key: TOKEN_KEY } }));
    }
    return;
  }
  localStorage.setItem(TOKEN_KEY, next);
  const workspaceId = workspaceFromToken(next);
  if (workspaceId) setWorkspaceId(workspaceId);
  if (previous !== next) {
    __getCache.clear();
    __getInflight.clear();
    window.dispatchEvent(new CustomEvent(AUTH_STORAGE_EVENT, { detail: { key: TOKEN_KEY } }));
  }
}

function roleFromToken(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length !== 3) return "";
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return String(payload?.role || "").toLowerCase();
  } catch {
    return "";
  }
}

function isAuthMeRequest(config) {
  const url = String(config?.url || "");
  return /(^|\/)auth\/me(?:$|[?#])/.test(url);
}

async function resolveWorkspaceIdFromApi(token) {
  if (!token) return "";
  if (__workspaceResolvePromise) return __workspaceResolvePromise;

  __workspaceResolvePromise = axios
    .get(`${API_BASE_URL}/workspaces`, {
      timeout: 10000,
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      const list = Array.isArray(res?.data?.workspaces) ? res.data.workspaces : [];
      const firstId =
        String(list?.[0]?._id || list?.[0]?.id || "").trim();
      if (firstId) {
        setWorkspaceId(firstId);
        return firstId;
      }
      return "";
    })
    .catch(() => "")
    .finally(() => {
      __workspaceResolvePromise = null;
    });

  return __workspaceResolvePromise;
}

api.interceptors.request.use((config) => {
  const proceed = async () => {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    let workspaceId = getWorkspaceId();
    const tokenRole = roleFromToken(token);
    const isAdminRole = tokenRole === "admin" || tokenRole === "super_admin";
    if (!workspaceId && token && !isAdminRole) {
      workspaceId = workspaceFromToken(token) || "";
      if (!workspaceId) {
        workspaceId = await resolveWorkspaceIdFromApi(token);
      }
      if (workspaceId) setWorkspaceId(workspaceId);
    }

    if (workspaceId) {
      config.headers = config.headers || {};
      config.headers["x-workspace-id"] = workspaceId;
    }
    return config;
  };

  return proceed();
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

    if (status === 401 && isAuthMeRequest(err?.config)) {
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
  ...buildApiGroupPrimary(api, unwrap),
  ...buildApiGroupAdmin(api, unwrap),
  ...buildApiGroupSecondary(api, unwrap, API_BASE_URL),
};
