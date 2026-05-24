import { useEffect, useState } from "react";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { CheckCircle2, Settings as SettingsIcon, Copy, Check } from "lucide-react";
import { CrmSectionNav } from "@modules/crm/components/CrmSectionNav";

type WorkspaceCrm = {
  id: string;
  crmEnabled?: boolean;
  crmSettings?: {
    leadWindowHours?: number;
    assignmentLockMinutes?: number;
    autoAssignEnabled?: boolean;
    assignmentMode?: "ROUND_ROBIN" | "LEAST_ACTIVE" | "FIXED_LIMIT" | "MANUAL";
    autoAssignFromTime?: string | null;
    autoAssignToTime?: string | null;
  };
};

type CrmWorkspaceRes = { success: boolean; workspace: WorkspaceCrm };

export default function CrmSettingsPage() {
  const [workspace, setWorkspace] = useState<WorkspaceCrm | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [copiedWorkspaceId, setCopiedWorkspaceId] = useState(false);
  const [leadWindowWarning, setLeadWindowWarning] = useState<string | null>(null);

  const [leadWindowHours, setLeadWindowHours] = useState(22);
  const [assignmentLockMinutes, setAssignmentLockMinutes] = useState(5);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const [assignmentMode, setAssignmentMode] = useState<
    "ROUND_ROBIN" | "LEAST_ACTIVE" | "FIXED_LIMIT" | "MANUAL"
  >("ROUND_ROBIN");
  const [assignFromTime, setAssignFromTime] = useState<string>("");
  const [assignToTime, setAssignToTime] = useState<string>("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    API.crm
      .workspace()
      .then((res: CrmWorkspaceRes) => {
        if (!active) return;
        setWorkspace(res.workspace || null);
        const rawLeadWindow = Number(res?.workspace?.crmSettings?.leadWindowHours || 22);
        if (rawLeadWindow > 22) {
          setLeadWindowWarning(`Lead window is currently ${rawLeadWindow}h. Max supported is 22h. It will be saved as 22h.`);
          setLeadWindowHours(22);
        } else if (rawLeadWindow < 1 || !Number.isFinite(rawLeadWindow)) {
          setLeadWindowWarning(null);
          setLeadWindowHours(22);
        } else {
          setLeadWindowWarning(null);
          setLeadWindowHours(rawLeadWindow);
        }
        setAssignmentLockMinutes(Number(res?.workspace?.crmSettings?.assignmentLockMinutes || 5));
        setAutoAssignEnabled(res?.workspace?.crmSettings?.autoAssignEnabled !== false);
        setAssignmentMode((res?.workspace?.crmSettings?.assignmentMode as any) || "ROUND_ROBIN");
        setAssignFromTime(String(res?.workspace?.crmSettings?.autoAssignFromTime || ""));
        setAssignToTime(String(res?.workspace?.crmSettings?.autoAssignToTime || ""));
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
      await API.crm.setLeadWindowHours(Math.max(1, Math.min(22, Number(leadWindowHours) || 1)));
      await API.crm.setAssignmentLockMinutes(assignmentLockMinutes);
      if (!autoAssignEnabled) {
        await API.crm.setAssignmentMode({ autoAssignEnabled: false, assignmentMode: "MANUAL" });
        await API.crm.setAssignmentSchedule({ autoAssignFromTime: null, autoAssignToTime: null });
      } else {
        await API.crm.setAssignmentMode({ autoAssignEnabled: true, assignmentMode });
        await API.crm.setAssignmentSchedule({
          autoAssignFromTime: assignFromTime || null,
          autoAssignToTime: assignToTime || null,
        });
      }
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
      {leadWindowWarning ? <Alert variant="warning">{leadWindowWarning}</Alert> : null}
      {saved ? (
        <Alert variant="success">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={16} /> {saved}
          </span>
        </Alert>
      ) : null}


      <Card className="p-5 border-slate-200 shadow-sm rounded-[5px]">
        <div className="text-sm font-black text-slate-900">Lead assignment</div>
        <div className="mt-1 text-xs text-slate-500 font-medium">
          First select assignment method. If Manual, leads are saved but not auto-assigned.
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Select
            label="Assignment method"
            value={autoAssignEnabled ? "AUTO" : "MANUAL"}
            onChange={(e) => {
              const next = e.target.value === "AUTO";
              setAutoAssignEnabled(next);
              if (!next) {
                setAssignmentMode("MANUAL");
                setAssignFromTime("");
                setAssignToTime("");
              } else if (String(assignmentMode || "").toUpperCase() === "MANUAL") {
                setAssignmentMode("ROUND_ROBIN");
              }
            }}
            disabled={busy || loading || !workspace?.crmEnabled}
          >
            <option value="MANUAL">MANUAL</option>
            <option value="AUTO">AUTO</option>
          </Select>

          {!autoAssignEnabled ? (
            <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-4">
              <div className="mt-1 text-sm font-bold text-slate-700">
                Auto assignment is disabled. Use Leads tab to assign manually.
              </div>
            </div>
          ) : (
            <Select
              label="Auto method"
              value={assignmentMode}
              onChange={(e) => setAssignmentMode(e.target.value as any)}
              disabled={busy || loading || !workspace?.crmEnabled}
            >
              <option value="ROUND_ROBIN">ROUND_ROBIN</option>
              <option value="LEAST_ACTIVE">LEAST_ACTIVE</option>
              <option value="FIXED_LIMIT">FIXED_LIMIT</option>
              <option value="PERCENTAGE_BASED" disabled>
                PERCENTAGE_BASED (coming soon)
              </option>
              <option value="PERFORMANCE_BASED" disabled>
                PERFORMANCE_BASED (coming soon)
              </option>
            </Select>
          )}
        </div>

        {autoAssignEnabled ? (
          <>
            <div className="mt-4 rounded-[5px] border border-slate-200 bg-white p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Auto assignment rules</div>
              <div className="mt-1 text-xs text-slate-500 font-medium">
                Leads within the lead window are saved immediately and assigned during the time window, using the selected auto method.
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Select
                  label="leadWindowHours"
                  value={String(leadWindowHours)}
                  onChange={(e) => setLeadWindowHours(Number(e.target.value))}
                  disabled={busy || loading || !workspace?.crmEnabled}
                >
                  {Array.from({ length: 22 }, (_, i) => i + 1).map((v) => (
                    <option key={v} value={String(v)}>
                      {v} hour{v === 1 ? "" : "s"}
                    </option>
                  ))}
                </Select>

                <Select
                  label="assignmentLockMinutes"
                  value={String(assignmentLockMinutes)}
                  onChange={(e) => setAssignmentLockMinutes(Number(e.target.value))}
                  disabled={busy || loading || !workspace?.crmEnabled}
                >
                  {Array.from({ length: 11 }, (_, i) => i).map((v) => (
                    <option key={v} value={String(v)}>
                      {v} minute{v === 1 ? "" : "s"}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="mt-3 text-[11px] text-slate-500 font-semibold">
                Tip: keep lock at 5 minutes to prevent late replies after reassignment. Set 0 to disable lock.
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Input
                label="Assignment time (from)"
                type="time"
                value={assignFromTime}
                onChange={(e) => setAssignFromTime(e.target.value)}
                disabled={busy || loading || !workspace?.crmEnabled}
              />
              <Input
                label="Assignment time (to)"
                type="time"
                value={assignToTime}
                onChange={(e) => setAssignToTime(e.target.value)}
                disabled={busy || loading || !workspace?.crmEnabled}
              />
            </div>
            <div className="mt-3 text-[11px] text-slate-500 font-semibold">
              Leads within the lead window are saved immediately. If they arrive outside the assignment time window, they will be assigned when the next assignment window starts.
            </div>
          </>
        ) : null}
      </Card>
    </div>
  );
}
