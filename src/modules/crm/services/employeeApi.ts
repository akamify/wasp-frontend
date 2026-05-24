import axios from "axios";
import { getEmployeeToken, setEmployeeToken } from "@modules/crm/services/employeeAuthStorage";

const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const isBrowser = typeof window !== "undefined";
const isLocalHost =
  isBrowser &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export const EMPLOYEE_API_BASE_URL = envBaseUrl || (isLocalHost ? "http://localhost:3000" : "/api");

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
