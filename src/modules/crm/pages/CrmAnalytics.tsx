import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Alert } from "@components/ui/Alert";
import { BarChart3, Users, Timer, MessageSquare } from "lucide-react";
import { cn } from "@shared/utils/cn";
import { CrmSectionNav } from "@modules/crm/components/CrmSectionNav";

type WorkspaceCrm = {
  crmEnabled?: boolean;
  employeesCount?: number;
  crmSettings?: { leadWindowHours?: number; assignmentLockMinutes?: number };
};

type CrmWorkspaceRes = { success: boolean; workspace: WorkspaceCrm };

type ConversationsRes = { success: boolean; conversations: any[] };

function Stat({
  label,
  value,
  icon: Icon,
  bg,
  color,
}: {
  label: string;
  value: string;
  icon: any;
  bg: string;
  color: string;
}) {
  return (
    <Card className="p-6 relative overflow-hidden border-slate-200 shadow-sm rounded-[5px]">
      <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full -mr-12 -mt-12 opacity-50", bg)} />
      <div className="flex items-center justify-between relative z-10">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</div>
          <div className="mt-1 text-3xl font-black tracking-tight text-slate-900">{value}</div>
        </div>
        <div className={cn("p-3 rounded-[5px]", bg, color)}>
          <Icon size={22} />
        </div>
      </div>
    </Card>
  );
}

export default function CrmAnalyticsPage() {
  const [workspace, setWorkspace] = useState<WorkspaceCrm | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([API.crm.workspace(), API.conversations.list({ limit: 200 })])
      .then(([w, convs]: [CrmWorkspaceRes, ConversationsRes]) => {
        if (!active) return;
        setWorkspace(w?.workspace || null);
        setConversations(Array.isArray(convs?.conversations) ? convs.conversations : []);
      })
      .catch((e: any) => {
        if (!active) return;
        setError(e?.response?.data?.message || "Failed to load CRM analytics");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const leadRows = useMemo(() => {
    return (conversations || []).filter((c) => !!c?.leadStatus || !!c?.assignedEmployeeId);
  }, [conversations]);

  const openCount = useMemo(() => leadRows.filter((c) => String(c?.leadStatus || "").toUpperCase() === "OPEN").length, [leadRows]);
  const unassignedCount = useMemo(
    () => leadRows.filter((c) => !c?.assignedEmployeeId || String(c?.leadStatus || "").toUpperCase() === "UNASSIGNED").length,
    [leadRows]
  );

  const avgFirstResponseMs = useMemo(() => {
    const rows = leadRows
      .map((c) => Number(c?.firstResponseDurationMs || 0))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (!rows.length) return 0;
    return Math.round(rows.reduce((a, b) => a + b, 0) / rows.length);
  }, [leadRows]);

  function fmtMs(ms: number) {
    if (!ms) return "-";
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.round(m / 60);
    return `${h}h`;
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 pb-24">
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">CRM</div>
        <h1 className="mt-1 text-3xl md:text-4xl font-black tracking-tighter text-slate-900">Analytics</h1>
        <p className="mt-2 text-slate-500 font-medium">Live workspace snapshot based on current lead fields.</p>
      </div>

      <CrmSectionNav />

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Lead rows" value={loading ? "..." : String(leadRows.length)} icon={MessageSquare} bg="bg-slate-50" color="text-slate-700" />
        <Stat label="Open" value={loading ? "..." : String(openCount)} icon={BarChart3} bg="bg-emerald-50" color="text-emerald-700" />
        <Stat label="Unassigned" value={loading ? "..." : String(unassignedCount)} icon={Users} bg="bg-amber-50" color="text-amber-800" />
        <Stat label="Avg 1st reply" value={loading ? "..." : fmtMs(avgFirstResponseMs)} icon={Timer} bg="bg-blue-50" color="text-blue-700" />
      </div>

      <Card className="p-6 border-slate-200 shadow-sm rounded-[5px]">
        <div className="text-sm font-black text-slate-900">Workspace</div>
        <div className="mt-2 grid gap-2 md:grid-cols-3 text-[12px]">
          <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">CRM</div>
            <div className="mt-1 font-black text-slate-900">{workspace?.crmEnabled ? "Enabled" : "Disabled"}</div>
          </div>
          <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employees</div>
            <div className="mt-1 font-black text-slate-900">{String(workspace?.employeesCount || 0)}</div>
          </div>
          <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lead window</div>
            <div className="mt-1 font-black text-slate-900">{String(workspace?.crmSettings?.leadWindowHours || 48)}h</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
