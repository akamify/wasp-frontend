import { useEffect, useState } from "react";
import { API } from "@api/api";

type Props = {
  workspaceId: string;
  busy?: boolean;
};

export function UserCrmCard({ workspaceId, busy }: Props) {
  const [loading, setLoading] = useState(false);
  const [crmEnabled, setCrmEnabled] = useState<boolean | null>(null);
  const [leadWindowHours, setLeadWindowHours] = useState<number>(48);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    API.admin
      .crmWorkspace(workspaceId)
      .then((res: any) => {
        const w = res?.workspace;
        setCrmEnabled(Boolean(w?.crmEnabled));
        setLeadWindowHours(Number(w?.crmSettings?.leadWindowHours || 48));
      })
      .catch((e: any) => setError(e?.response?.data?.message || "Failed to load CRM settings"))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  async function toggle(next: boolean) {
    if (!workspaceId) return;
    if (!window.confirm(`${next ? "Enable" : "Disable"} CRM for this workspace?`)) return;
    setLoading(true);
    setError(null);
    try {
      await API.admin.crmSetEnabled(workspaceId, next);
      setCrmEnabled(next);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveLeadWindow() {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      await API.admin.crmSetLeadWindowHours(workspaceId, leadWindowHours);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[5px] border border-slate-200 p-3 text-[11px] space-y-3">
      <div className="font-black text-slate-700 mb-1">CRM</div>
      {error ? <div className="rounded-[5px] bg-rose-50 border border-rose-100 p-2 text-rose-700 font-bold">{error}</div> : null}
      <div className="flex items-center justify-between gap-3 rounded-[5px] bg-slate-50 px-3 py-2">
        <div>
          <div className="font-black text-slate-700">CRM Access</div>
          <div className="text-slate-500">{crmEnabled ? "enabled" : "disabled"}</div>
        </div>
        <button
          type="button"
          disabled={busy || loading || crmEnabled === null}
          onClick={() => toggle(!crmEnabled)}
          className="h-8 rounded-[5px] border border-slate-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-700 disabled:opacity-50"
        >
          {crmEnabled ? "Disable" : "Enable"}
        </button>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-[5px] bg-slate-50 px-3 py-2">
        <div>
          <div className="font-black text-slate-700">leadWindowHours</div>
          <div className="text-slate-500">Inbound lead window</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="h-8 w-20 rounded-[5px] border border-slate-200 bg-white px-2 text-[11px] font-black text-slate-700"
            type="number"
            min={1}
            max={720}
            value={leadWindowHours}
            onChange={(e) => setLeadWindowHours(Math.max(1, Math.min(720, Number(e.target.value || 0) || 0)))}
            disabled={busy || loading}
          />
          <button
            type="button"
            disabled={busy || loading}
            onClick={saveLeadWindow}
            className="h-8 rounded-[5px] border border-slate-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
