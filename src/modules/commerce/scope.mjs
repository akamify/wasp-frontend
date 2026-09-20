export function createWorkspaceScope(workspaceId, transport, currentWorkspace) {
  let disposed = false;
  const controllers = new Set();
  const check = () => { if (disposed || currentWorkspace() !== workspaceId) throw new DOMException("Workspace changed", "AbortError"); };
  return {
    async request(path, options = {}) {
      check();
      if (options.signal?.aborted) throw new DOMException("Request cancelled", "AbortError");
      const controller = new AbortController(); controllers.add(controller);
      const cancel = () => controller.abort();
      if (options.signal?.aborted) cancel();
      options.signal?.addEventListener("abort", cancel, { once: true });
      try {
        const result = await transport({ ...options, url: `/commerce${path}`, expectedWorkspaceId: workspaceId,
          headers: { ...options.headers, "x-workspace-id": workspaceId }, signal: controller.signal });
        check(); if (controller.signal.aborted) throw new DOMException("Request cancelled", "AbortError");
        return result.data;
      } finally { controllers.delete(controller); options.signal?.removeEventListener("abort", cancel); }
    },
    dispose() { disposed = true; for (const controller of controllers) controller.abort(); controllers.clear(); },
  };
}
