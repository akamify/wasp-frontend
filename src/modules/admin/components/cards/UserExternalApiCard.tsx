type Props = {
  workspaceId: string;
  busy?: boolean;
  enabled: boolean | null;
  loading?: boolean;
  error?: string | null;
  onToggle: (next: boolean) => Promise<void>;
};

export function UserExternalApiCard({ busy, enabled, loading, error, onToggle }: Props) {
  return (
    <div className="rounded-[5px] border border-slate-200 p-3 text-[11px] space-y-3">
      <div className="font-black text-slate-700 mb-1">External API Access</div>
      {error ? (
        <div className="rounded-[5px] bg-rose-50 border border-rose-100 p-2 text-rose-700 font-bold">
          {error}
        </div>
      ) : null}

      <div className="rounded-[5px] bg-slate-50 px-3 py-2">
        <div className="font-black text-slate-700">Workspace External Chat API</div>
        <div className="text-slate-500">
          Entitlement gate for external CRM inbox APIs (SSE + REST) via API key.
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="text-slate-600 font-bold">
            {enabled === null ? "status: unknown" : enabled ? "enabled" : "disabled"}
          </div>
          <button
            type="button"
            disabled={busy || loading || enabled === null}
            onClick={() => onToggle(!enabled)}
            className="h-8 rounded-[5px] border border-slate-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-700 disabled:opacity-50"
          >
            {enabled ? "Disable Workspace" : "Enable Workspace"}
          </button>
        </div>
        {!enabled && enabled !== null ? (
          <div className="mt-2 text-[11px] font-semibold text-amber-700">
            Workspace External Chat API is disabled. External chat endpoints will be denied until this is enabled.
          </div>
        ) : null}
      </div>
    </div>
  );
}
