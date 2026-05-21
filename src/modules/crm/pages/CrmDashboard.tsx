import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { cn } from "@shared/utils/cn";
import { BriefcaseBusiness, Users, Timer, Settings as SettingsIcon, ArrowRight, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { CrmSectionNav } from "@modules/crm/components/CrmSectionNav";

type WorkspaceCrm = {
  id: string;
  name?: string;
  crmEnabled?: boolean;
  crmSettings?: { leadWindowHours?: number; assignmentLockMinutes?: number };
  employeesCount?: number;
};

type CrmWorkspaceRes = { success: boolean; workspace: WorkspaceCrm };

function StatCard({
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
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</div>
          <div className="mt-1 text-3xl font-black tracking-tight text-slate-900 truncate">{value}</div>
        </div>
        <div className={cn("p-3 rounded-[5px]", bg, color)}>
          <Icon size={22} />
        </div>
      </div>
    </Card>
  );
}

export default function CrmDashboardPage() {
  const [workspace, setWorkspace] = useState<WorkspaceCrm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedWorkspaceId, setCopiedWorkspaceId] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    API.crm
      .workspace()
      .then((res: CrmWorkspaceRes) => {
        if (!active) return;
        setWorkspace(res.workspace || null);
      })
      .catch((e: any) => {
        if (!active) return;
        setError(e?.response?.data?.message || "Failed to load CRM workspace");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const leadWindowHours = Number(workspace?.crmSettings?.leadWindowHours || 48);
  const assignmentLockMinutes = Number(workspace?.crmSettings?.assignmentLockMinutes || 5);

  async function copyWorkspaceId() {
    const id = String(workspace?.id || "").trim();
    if (!id) return;
    await navigator.clipboard.writeText(id);
    setCopiedWorkspaceId(true);
    window.setTimeout(() => setCopiedWorkspaceId(false), 1200);
  }

  const cards = useMemo(() => {
    return [
      {
        label: "CRM Status",
        value: workspace?.crmEnabled ? "Enabled" : "Disabled",
        icon: BriefcaseBusiness,
        bg: workspace?.crmEnabled ? "bg-emerald-50" : "bg-slate-50",
        color: workspace?.crmEnabled ? "text-emerald-600" : "text-slate-600",
      },
      {
        label: "Employees",
        value: String(workspace?.employeesCount || 0),
        icon: Users,
        bg: "bg-blue-50",
        color: "text-blue-600",
      },
      {
        label: "Lead Window",
        value: `${leadWindowHours}h`,
        icon: Timer,
        bg: "bg-amber-50",
        color: "text-amber-700",
      },
    ];
  }, [workspace, leadWindowHours]);

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">CRM</div>
          <h1 className="mt-1 text-3xl md:text-4xl font-black tracking-tighter text-slate-900">Dashboard</h1>
          <p className="mt-2 text-slate-500 font-medium">
            Leads distribution + employee inbox access for <span className="font-black text-slate-800">{workspace?.name || "Workspace"}</span>.
          </p>
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
          <Link to="/app/crm/settings">
            <Button className="gap-2">
              <SettingsIcon size={16} /> Settings
            </Button>
          </Link>
          <Link to="/app/crm/employees">
            <Button variant="ghost" className="gap-2">
              Employees <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>

      <CrmSectionNav />

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={loading ? "..." : c.value} icon={c.icon} bg={c.bg} color={c.color} />
        ))}
      </div>

      <Card className="p-6 border-slate-200 shadow-sm rounded-[5px]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-black text-slate-900">Assignment safety</div>
            <div className="mt-1 text-xs text-slate-500 font-medium">
              After assignment changes, the previous assignee is blocked from replying during a lock window to prevent stale UI replies.
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lock</div>
            <div className="text-xl font-black text-slate-900">{assignmentLockMinutes}m</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
