import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { crmEmployeeAuthService } from "@modules/crm/services/crmEmployeeAuth.service";
import { getEmployeeToken, setEmployeeToken } from "@modules/crm/services/employeeAuthStorage";

type Employee = {
  id: string;
  workspaceId: string;
  email: string;
  name: string;
  role?: string;
  permissions?: Record<string, boolean>;
};

type EmployeeAuthState = {
  token: string;
  employee: Employee | null;
  loading: boolean;
};

type EmployeeAuthContextValue = EmployeeAuthState & {
  login: (workspaceId: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const EmployeeAuthContext = createContext<EmployeeAuthContextValue | null>(null);

export function EmployeeAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EmployeeAuthState>(() => ({
    token: getEmployeeToken(),
    employee: null,
    loading: false,
  }));

  const login = useCallback(async (workspaceId: string, email: string, password: string) => {
    setState((s) => ({ ...s, loading: true }));
    const res = await crmEmployeeAuthService.login({ workspaceId, email, password });
    const token = String(res?.token || "");
    if (!token) throw new Error("Missing token");
    setEmployeeToken(token);
    setState({ token, employee: res.employee || null, loading: false });
  }, []);

  const logout = useCallback(() => {
    const token = getEmployeeToken();
    // Best-effort server-side logout to invalidate sessionVersion and record logout event.
    if (token) {
      crmEmployeeAuthService.logout().catch(() => {});
    }
    setEmployeeToken("");
    setState({ token: "", employee: null, loading: false });
  }, []);

  const value = useMemo<EmployeeAuthContextValue>(() => ({ ...state, login, logout }), [state, login, logout]);
  return <EmployeeAuthContext.Provider value={value}>{children}</EmployeeAuthContext.Provider>;
}

export function useEmployeeAuth() {
  const ctx = useContext(EmployeeAuthContext);
  if (!ctx) throw new Error("useEmployeeAuth must be used within EmployeeAuthProvider");
  return ctx;
}
