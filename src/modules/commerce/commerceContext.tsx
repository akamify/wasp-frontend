import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { AxiosRequestConfig } from "axios";
import { api, AUTH_STORAGE_EVENT, getWorkspaceId } from "@api/api";
import { createWorkspaceScope } from "./scope.mjs";
import type { Access, Environment } from "./types";
import { commerceErrorMessage } from "./errorMessage.mjs";
export type Request = <T>(path: string, options?: AxiosRequestConfig) => Promise<T>;
type Context = { workspaceId: string; access: Access; request: Request; environment: Environment; setEnvironment: (env: Environment) => void; can: (key: string) => boolean };
const CommerceContext = createContext<Context | null>(null);
export const subscribeWorkspace = (fn: () => void) => { window.addEventListener(AUTH_STORAGE_EVENT, fn); window.addEventListener("storage", fn); return () => { window.removeEventListener(AUTH_STORAGE_EVENT, fn); window.removeEventListener("storage", fn); }; };
export const useWorkspaceId = () => useSyncExternalStore(subscribeWorkspace, getWorkspaceId, () => "");
export const errorMessage = (error: unknown) => commerceErrorMessage(error);
export const cancelled = (e: unknown) => e instanceof DOMException && e.name === "AbortError" || (e as { code?: string })?.code === "ERR_CANCELED";
const defaultTransport = (options: AxiosRequestConfig) => api.request(options);
export function CommerceProvider({ workspaceId, children, transport = defaultTransport, currentWorkspace = getWorkspaceId }: {
  workspaceId: string; children: ReactNode; transport?: (options: AxiosRequestConfig) => Promise<{ data: unknown }>; currentWorkspace?: () => string;
}) {
  const [resource, setResource] = useState<{ workspaceId: string; access: Access; request: Request } | null>(null), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  const [environment, setEnvironment] = useState<Environment>("live");
  useEffect(() => { let active = true; setError(""); setResource(null);
    const scope = createWorkspaceScope(workspaceId, transport, currentWorkspace);
    scope.request("/access").then((access: Access) => { if (active) setResource({ workspaceId, access, request: scope.request as Request }); }).catch((e: unknown) => { if (active && !cancelled(e)) setError(errorMessage(e)); });
    return () => { active = false; scope.dispose(); };
  }, [workspaceId, transport, currentWorkspace, retry]);
  if (!workspaceId) return <p className="p-8">Select a workspace to open Commerce.</p>;
  if (error) return <div role="alert" className="p-8 space-y-3"><p>{error}</p><button className="underline" onClick={() => setRetry((v) => v + 1)}>Retry</button></div>;
  if (!resource || resource.workspaceId !== workspaceId) return <p role="status" className="p-8 text-slate-500">Loading Commerce…</p>;
  const { access, request } = resource;
  return <CommerceContext.Provider value={{ workspaceId, access, request, environment, setEnvironment,
    can: (key) => access.permissions.includes(key) }}>{children}</CommerceContext.Provider>;
}
export function useCommerce() { const context = useContext(CommerceContext); if (!context) throw new Error("Commerce context is required"); return context; }
export function useCommerceQuery<T>(path: string | null, params?: Record<string, unknown>, retainOnRefresh = false) {
  const { request } = useCommerce(), key = JSON.stringify(params || {});
  const identity = `${path}:${key}`;
  const [state, setState] = useState<{ data?: T; loading: boolean; error: string; identity: string }>({ loading: !!path, error: "", identity });
  const [version, setVersion] = useState(0);
  useEffect(() => { const controller = new AbortController(); let active = true;
    setState((previous) => ({ data: retainOnRefresh && previous.identity === identity ? previous.data : undefined, loading: !!path, error: "", identity }));
    if (path) request<T>(path, { params: JSON.parse(key), signal: controller.signal })
      .then((data) => { if (active) setState({ data, loading: false, error: "", identity }); })
      .catch((e) => { if (active && !cancelled(e)) setState({ loading: false, error: errorMessage(e), identity }); });
    return () => { active = false; controller.abort(); };
  }, [path, key, request, version, retainOnRefresh]);
  return { ...(state.identity === identity ? state : { data: undefined, loading: !!path, error: "" }), reload: () => setVersion((v) => v + 1) };
}
export function useCommerceAction() {
  const { request } = useCommerce(), mounted = useRef(true), lock = useRef(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function run<T>(path: string, data: unknown, done?: (value: T) => void, method = "POST") {
    if (lock.current) return; lock.current = true; setBusy(true); setError("");
    try { const result = await request<T>(path, { method, data }); if (mounted.current) done?.(result); }
    catch (e) { if (mounted.current && !cancelled(e)) setError(errorMessage(e)); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  return { busy, error, run, clearError: () => setError("") };
}
