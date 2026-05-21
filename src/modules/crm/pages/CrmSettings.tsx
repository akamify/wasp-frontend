import { useEffect, useState } from "react";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { CheckCircle2, Settings as SettingsIcon, Copy, Check } from "lucide-react";
import { CrmSectionNav } from "@modules/crm/components/CrmSectionNav";

type WorkspaceCrm = {
  id: string;
  crmEnabled?: boolean;
  crmSettings?: { leadWindowHours?: number; assignmentLockMinutes?: number };
};

type CrmWorkspaceRes = { success: boolean; workspace: WorkspaceCrm };

export default function CrmSettingsPage() {
  const [workspace, setWorkspace] = useState<WorkspaceCrm | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [copiedWorkspaceId, setCopiedWorkspaceId] = useState(false);

  const [leadWindowHours, setLeadWindowHours] = useState(48);
  const [assignmentLockMinutes, setAssignmentLockMinutes] = useState(5);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    API.crm
      .workspace()
      .then((res: CrmWorkspaceRes) => {
        if (!active) return;
        setWorkspace(res.workspace || null);
        setLeadWindowHours(Number(res?.workspace?.crmSettings?.leadWindowHours || 48));
        setAssignmentLockMinutes(Number(res?.workspace?.crmSettings?.assignmentLockMinutes || 5));
      })
      .catch((e: any) => {
        if (!active) return;
        setError(e?.response?.data?.message || "Failed to load CRM settings");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      await API.crm.setLeadWindowHours(leadWindowHours);
      await API.crm.setAssignmentLockMinutes(assignmentLockMinutes);
      setSaved("Saved");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to save");
    } finally {
      setBusy(false);
      window.setTimeout(() => setSaved(null), 1600);
    }
  }

  async function copyWorkspaceId() {
    const id = String(workspace?.id || "").trim();
    if (!id) return;
    await navigator.clipboard.writeText(id);
    setCopiedWorkspaceId(true);
    window.setTimeout(() => setCopiedWorkspaceId(false), 1200);
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">CRM</div>
          <h1 className="mt-1 text-3xl md:text-4xl font-black tracking-tighter text-slate-900">Settings</h1>
          <p className="mt-2 text-slate-500 font-medium">Lead window + assignment safety controls.</p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-[5px] border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
            <span className="uppercase tracking-widest text-slate-400">Workspace ID</span>
            <span>{workspace?.id || "-"}</span>
            {workspace?.id ? (
              <button type="button" onClick={() => void copyWorkspaceId()} className="rounded p-1 hover:bg-slate-100" title={copiedWorkspaceId ? "Copied" : "Copy"}>
                {copiedWorkspaceId ? <Check size={12} /> : <Copy size={12} />}
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={save} disabled={busy || loading || !workspace?.crmEnabled} className="gap-2">
            <SettingsIcon size={16} /> {busy ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <CrmSectionNav />

      {error ? <Alert variant="danger">{error}</Alert> : null}
      {saved ? (
        <Alert variant="success">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={16} /> {saved}
          </span>
        </Alert>
      ) : null}

      <Card className="p-5 border-slate-200 shadow-sm rounded-[5px]">
        <div className="text-sm font-black text-slate-900">CRM status</div>
        <div className="mt-1 text-xs text-slate-500 font-medium">
          CRM features are available only when <span className="font-black text-slate-700">workspace.crmEnabled</span> is enabled.
        </div>
        <div className="mt-4 rounded-[5px] border border-slate-200 bg-slate-50 p-3 text-[12px] font-semibold text-slate-700">
          {loading ? "Loading..." : workspace?.crmEnabled ? "CRM is enabled for this workspace." : "CRM is disabled for this workspace."}
        </div>
      </Card>

      <Card className="p-5 border-slate-200 shadow-sm rounded-[5px]">
        <div className="text-sm font-black text-slate-900">Lead window</div>
        <div className="mt-1 text-xs text-slate-500 font-medium">
          After this window expires, an inbound conversation can become distributable again.
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input
            label="leadWindowHours"
            type="number"
            min={1}
            max={720}
            value={leadWindowHours}
            onChange={(e) => setLeadWindowHours(Math.max(1, Math.min(720, Number(e.target.value || 0) || 0)))}
            disabled={busy || loading || !workspace?.crmEnabled}
          />
          <Input
            label="assignmentLockMinutes"
            type="number"
            min={1}
            max={120}
            value={assignmentLockMinutes}
            onChange={(e) => setAssignmentLockMinutes(Math.max(1, Math.min(120, Number(e.target.value || 0) || 0)))}
            disabled={busy || loading || !workspace?.crmEnabled}
          />
        </div>
        <div className="mt-3 text-[11px] text-slate-500 font-semibold">
          Tip: keep lock at 5 minutes to prevent late replies after reassignment.
        </div>
      </Card>
    </div>
  );
}
