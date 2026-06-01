import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { API, clearApiGetCache, getToken, setToken, setWorkspaceId } from "@api/api";

type User = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role?: "user" | "admin" | "super_admin";
  permissions?: {
    pages?: string[];
    components?: string[];
    actions?: string[];
  };
  twoFactorEnabled?: boolean;
  createdAt?: string;
};

type Workspace = {
  id: string;
  name?: string;
  plan?: string;
};

type AuthState = {
  token: string;
  user: User | null;
  workspace: Workspace | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name?: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshMe: (options?: { silent?: boolean }) => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    token: getToken(),
    user: null,
    workspace: null,
    loading: true,
  }));
  const refreshingRef = React.useRef(false);
  const lastRefreshAtRef = React.useRef(0);

  const refreshMe = useCallback(async (options?: { silent?: boolean }) => {
    const silent = !!options?.silent;
    const now = Date.now();
    if (refreshingRef.current) return;
    if (now - lastRefreshAtRef.current < 1500) return;
    refreshingRef.current = true;
    lastRefreshAtRef.current = now;

    const token = getToken();
    if (!token) {
      setState((s) => ({ ...s, token: "", user: null, workspace: null, loading: false }));
      refreshingRef.current = false;
      return;
    }

    setState((s) => ({ ...s, token, loading: silent ? s.loading : true }));
    try {
      const res = await API.auth.me();
      if (res?.workspace?.id) setWorkspaceId(res.workspace.id);
      setState((s) => ({ ...s, token, user: res.user, workspace: res.workspace || null, loading: false }));
    } catch {
      setToken("");
      setState((s) => ({ ...s, token: "", user: null, workspace: null, loading: false }));
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    const onFocus = () => {
      void refreshMe({ silent: true });
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshMe({ silent: true });
    };
    const timer = window.setInterval(() => {
      void refreshMe({ silent: true });
    }, 30000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await API.auth.login({ email, password });
    if (res?.requires2fa) return res;
    setToken(res.token);
    if (res?.workspace?.id) setWorkspaceId(res.workspace.id);

    // Admin sidebar/page gating depends on permissions which may not be present
    // on the login response. Hydrate immediately so no refresh is needed.
    try {
      const me = await API.auth.me();
      if (me?.workspace?.id) setWorkspaceId(me.workspace.id);
      setState({ token: res.token, user: me.user, workspace: me.workspace || null, loading: false });
    } catch {
      setState({ token: res.token, user: res.user, workspace: res.workspace || null, loading: false });
    }
    return res;
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const res = await API.auth.register({ email, password, name });
    if (res?.token) {
      setToken(res.token);
      if (res?.workspace?.id) setWorkspaceId(res.workspace.id);
      try {
        const me = await API.auth.me();
        if (me?.workspace?.id) setWorkspaceId(me.workspace.id);
        setState({ token: res.token, user: me.user, workspace: me.workspace || null, loading: false });
      } catch {
        setState({ token: res.token, user: res.user, workspace: res.workspace || null, loading: false });
      }
    }
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await API.auth.logout();
    } catch {}
    setToken("");
    setState({ token: "", user: null, workspace: null, loading: false });
  }, []);

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    const normalized = String(workspaceId || "").trim();
    if (!normalized) return;
    setWorkspaceId(normalized);
    clearApiGetCache();
    const res = await API.auth.me();
    setState((s) => ({ ...s, workspace: res.workspace || null, user: res.user || s.user, loading: false }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      register,
      logout,
      refreshMe,
      switchWorkspace,
    }),
    [state, login, register, logout, refreshMe, switchWorkspace]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

