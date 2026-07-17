import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  API,
  AUTH_STORAGE_EVENT,
  clearApiGetCache,
  getToken,
  setToken,
  setWorkspaceId,
  TOKEN_KEY,
  WORKSPACE_KEY,
} from "@api/api";

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

function isConfirmedAuthFailure(error: any) {
  const status = Number(error?.response?.status || 0);
  return status === 401 || status === 403;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    token: getToken(),
    user: null,
    workspace: null,
    loading: true,
  }));
  const refreshingRef = React.useRef(false);
  const refreshQueuedRef = React.useRef(false);
  const refreshMeRef = React.useRef<(options?: { silent?: boolean }) => Promise<void>>(async () => {});
  const lastRefreshAtRef = React.useRef(0);

  const refreshMe = useCallback(async (options?: { silent?: boolean }) => {
    const silent = !!options?.silent;
    const now = Date.now();
    if (refreshingRef.current) {
      refreshQueuedRef.current = true;
      return;
    }
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
      if (getToken() !== token) return;
      if (res?.workspace?.id) setWorkspaceId(res.workspace.id);
      setState((s) => ({ ...s, token, user: res.user, workspace: res.workspace || null, loading: false }));
    } catch (error: any) {
      if (getToken() !== token) return;
      if (isConfirmedAuthFailure(error)) {
        setToken("");
        setState((s) => ({ ...s, token: "", user: null, workspace: null, loading: false }));
        return;
      }
      setState((s) => ({ ...s, token, loading: false }));
    } finally {
      refreshingRef.current = false;
      if (refreshQueuedRef.current) {
        refreshQueuedRef.current = false;
        lastRefreshAtRef.current = 0;
        window.setTimeout(() => void refreshMeRef.current({ silent: true }), 0);
      }
    }
  }, []);
  refreshMeRef.current = refreshMe;

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    const syncSession = () => {
      lastRefreshAtRef.current = 0;
      const token = getToken();
      if (!token) {
        clearApiGetCache();
        setState({ token: "", user: null, workspace: null, loading: false });
        return;
      }
      setState((current) => ({ ...current, token, loading: true }));
      void refreshMe();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY || event.key === WORKSPACE_KEY || event.key === null) {
        syncSession();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_STORAGE_EVENT, syncSession);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_STORAGE_EVENT, syncSession);
    };
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
    const token = String(res?.token || "");
    if (!token) throw new Error("Missing login token");
    setToken(token);
    if (res?.workspace?.id) setWorkspaceId(res.workspace.id);
    setState({ token, user: res.user, workspace: res.workspace || null, loading: false });

    // Admin sidebar/page gating depends on permissions which may not be present
    // on the login response. Hydrate after the token is accepted, but do not
    // turn a successful login into a visible failure if this follow-up request
    // is delayed by deployment or gateway restart.
    void API.auth.me()
      .then((me) => {
        if (getToken() !== token) return;
        if (me?.workspace?.id) setWorkspaceId(me.workspace.id);
        setState({ token, user: me.user, workspace: me.workspace || null, loading: false });
      })
      .catch(() => {});
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

