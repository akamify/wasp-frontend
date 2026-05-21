const EMPLOYEE_TOKEN_KEY = "waspakamify_employee_token";

export function getEmployeeToken() {
  return localStorage.getItem(EMPLOYEE_TOKEN_KEY) || "";
}

export function setEmployeeToken(token: string) {
  if (!token) localStorage.removeItem(EMPLOYEE_TOKEN_KEY);
  else localStorage.setItem(EMPLOYEE_TOKEN_KEY, token);
}

