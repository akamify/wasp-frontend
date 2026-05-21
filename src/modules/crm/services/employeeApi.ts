import axios from "axios";

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

