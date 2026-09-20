export type ScopeOptions = { signal?: AbortSignal; headers?: Record<string, unknown>; [key: string]: unknown };
export function createWorkspaceScope(workspaceId: string, transport: (options: any) => Promise<{ data: unknown }>, currentWorkspace: () => string): {
  request(path: string, options?: ScopeOptions): Promise<any>;
  dispose(): void;
};
