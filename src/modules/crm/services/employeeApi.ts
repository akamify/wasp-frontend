import axios from "axios";
import { getEmployeeToken, setEmployeeToken } from "@modules/crm/services/employeeAuthStorage";

const rawEnvBaseUrl = String(
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.NEXT_PUBLIC_API_BASE_URL ||
  import.meta.env.NEXT_PUBLIC_API_URL ||
  ""
).trim();
const isBrowser = typeof window !== "undefined";
const isLocalHost =
  isBrowser &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const PRODUCTION_API_BASE_URL = "https://api.aiwizchat.com/api";

function normalizeApiBaseUrl(value: string) {
  const v = String(value || "").trim();
  if (!v || v === "/" || v === "./") return "";
  const normalized = v.replace(/\/+$/, "");
  try {
    const url = new URL(normalized);
    if (!url.pathname || url.pathname === "/") {
      url.pathname = "/api";
      return url.toString().replace(/\/+$/, "");
    }
  } catch {}
  return normalized;
}

const envBaseUrl = normalizeApiBaseUrl(rawEnvBaseUrl);
export const EMPLOYEE_API_BASE_URL = envBaseUrl || (isLocalHost ? "http://localhost:3000" : PRODUCTION_API_BASE_URL);

export const employeeApi = axios.create({
  baseURL: EMPLOYEE_API_BASE_URL,
  timeout: 20000,
});

let __employeeApiInterceptorsBound = false;
if (!__employeeApiInterceptorsBound) {
  __employeeApiInterceptorsBound = true;

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
}
