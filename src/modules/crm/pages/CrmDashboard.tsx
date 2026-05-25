import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { cn } from "@shared/utils/cn";
import {
  BriefcaseBusiness,
  Users,
  Timer,
  Settings as SettingsIcon,
  ArrowRight,
  Copy,
  Check,
  Activity,
  ArrowLeftRight,
  LogIn,
  LogOut,
} from "lucide-react";
import { Link } from "react-router-dom";
import { CrmSectionNav } from "@modules/crm/components/CrmSectionNav";
import { AdminChartLabels, AdminLineChart } from "@pages/admin/components/AdminMiniChart";
import { CrmStatCard } from "@modules/crm/pages/components/CrmStatCard";
import { CrmDashboardSkeleton } from "@components/ui/Skeletons";

export default function CrmDashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedWorkspaceId, setCopiedWorkspaceId] = useState(false);
  const [seriesKey, setSeriesKey] = useState<"assigned" | "unassigned" | "closed" | "pending">("assigned");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    API.crm
      .dashboard()
      .then((res: any) => {
        if (!active) return;
        setData(res?.dashboard || null);
      })
      .catch((e: any) => {
        if (!active) return;
        setError(e?.response?.data?.message || "Failed to load CRM dashboard");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const workspaceId = String(data?.workspace?.id || "");
  const workspaceName = String(data?.workspace?.name || "Workspace");

  const leadWindowHours = Number(data?.settings?.leadWindowHours || 48);
  const assignmentLockMinutes = Number(data?.settings?.assignmentLockMinutes || 5);
  const assignmentMode = String(data?.settings?.assignmentMode || "ROUND_ROBIN");
  const autoAssignEnabled = data?.settings?.autoAssignEnabled !== false;

  const employeesTotal = Number(data?.employees?.total || 0);
  const employeesActiveNow = Number(data?.employees?.activeNow || 0);
  const activeWindowMinutes = Number(data?.employees?.activeWindowMinutes || 10);

  const leadsTotal = Number(data?.leads?.total || 0);
  const leadsAssigned = Number(data?.leads?.assigned || 0);
  const leadsUnassigned = Number(data?.leads?.unassigned || 0);
  const leadsClosed = Number(data?.leads?.closed || 0);
  const leadsPending = Number(data?.leads?.pending || 0);

  async function copyWorkspaceId() {
    const id = String(workspaceId || "").trim();
    if (!id) return;
    await navigator.clipboard.writeText(id);
    setCopiedWorkspaceId(true);
    window.setTimeout(() => setCopiedWorkspaceId(false), 1200);
  }

  const cards = useMemo(() => {
    return [
      {
        label: "Total Leads",
        value: String(leadsTotal || 0),
        icon: BriefcaseBusiness,
        bg: "bg-slate-50",
        color: "text-slate-700",
      },
      {
        label: "Employees",
        value: String(employeesTotal || 0),
        icon: Users,
        bg: "bg-blue-50",
        color: "text-blue-600",
      },
      {
        label: "Active Now",
        value: String(employeesActiveNow || 0),
        icon: Activity,
        bg: "bg-emerald-50",
        color: "text-emerald-700",
      },
      {
        label: "Lead Window",
        value: `${leadWindowHours}h`,
        icon: Timer,
        bg: "bg-amber-50",
        color: "text-amber-700",
      },
    ];
  }, [employeesActiveNow, employeesTotal, leadWindowHours, leadsTotal]);

  const series = Array.isArray(data?.series?.[seriesKey]) ? data.series[seriesKey] : [];
  const points = (series || []).map((p: any) => ({ label: String(p.day || ""), count: Number(p.count || 0) }));
  const recent = Array.isArray(data?.recentActivities) ? data.recentActivities : [];

  if (loading && !data) return <CrmDashboardSkeleton />;

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">CRM</div>
          <h1 className="mt-1 text-3xl md:text-4xl font-black tracking-tighter text-slate-900">Dashboard</h1>
          <p className="mt-2 text-slate-500 font-medium">
            Leads distribution + employee inbox access for <span className="font-black text-slate-800">{workspaceName}</span>.
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-[5px] border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
            <span className="uppercase tracking-widest text-slate-400">Workspace ID</span>
            <span>{workspaceId || "-"}</span>
            {workspaceId ? (
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
          <Link to="/app/crm/leads">
            <Button variant="ghost" className="gap-2">
              Leads <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>

      <CrmSectionNav />

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <CrmStatCard key={c.label} label={c.label} value={loading ? "..." : c.value} icon={c.icon} bg={c.bg} color={c.color} />
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-8 border-slate-200 shadow-sm relative overflow-hidden rounded-[5px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-3xl rounded-full -mr-32 -mt-32" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Leads Trend</div>
              <div className="mt-1 text-xl font-black text-slate-900">Last 7 days</div>
              <div className="mt-1 text-sm text-slate-500 font-medium">
                Hover points to see day-wise counts.
              </div>
            </div>
            <div className="flex bg-slate-100 rounded-[5px] p-1">
              {[
                { key: "assigned", label: "Assigned" },
                { key: "unassigned", label: "Unassigned" },
                { key: "closed", label: "Closed" },
                { key: "pending", label: "Pending" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setSeriesKey(f.key as any)}
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[5px] transition-all",
                    seriesKey === f.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <AdminLineChart points={points} height={120} className="mt-2" />
            <AdminChartLabels points={points} />
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 grid gap-4 md:grid-cols-2 relative z-10">
            <div className="rounded-[5px] border border-slate-200 bg-white p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assignment</div>
              <div className="mt-1 text-sm font-black text-slate-900">Mode: {assignmentMode}</div>
              <div className="mt-1 text-xs text-slate-500 font-medium">
                Auto assign: <span className="font-black text-slate-800">{autoAssignEnabled ? "enabled" : "disabled"}</span>
              </div>
            </div>
            <div className="rounded-[5px] border border-slate-200 bg-white p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Safety</div>
              <div className="mt-1 text-sm font-black text-slate-900">Lock: {assignmentLockMinutes}m</div>
              <div className="mt-1 text-xs text-slate-500 font-medium">
                Active window: last {activeWindowMinutes} min
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 shadow-sm rounded-[5px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Lead Stats</div>
              <div className="mt-1 text-lg font-black text-slate-900">Current</div>
            </div>
          </div>

          <div className="grid gap-3 text-[12px]">
            {[
              { label: "Assigned leads", value: leadsAssigned, icon: ArrowLeftRight },
              { label: "Unassigned leads", value: leadsUnassigned, icon: BriefcaseBusiness },
              { label: "Closed leads", value: leadsClosed, icon: Check },
              { label: "Pending (in chat)", value: leadsPending, icon: Activity },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-[5px] border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] bg-white border border-slate-200 text-slate-700">
                    <row.icon size={14} />
                  </span>
                  <div className="truncate font-bold text-slate-700">{row.label}</div>
                </div>
                <div className="font-black text-slate-900">{loading ? "..." : row.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6 border-slate-200 shadow-sm rounded-[5px]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">Recent</div>
            <div className="mt-1 text-lg font-black text-slate-900">Employee activities</div>
            <div className="mt-1 text-sm text-slate-500 font-medium">Last 10 actions (assignments + login/logout).</div>
          </div>
        </div>

        <div className="space-y-2">
          {recent.map((a: any, idx: number) => {
            const at = a?.at ? new Date(a.at).toLocaleString() : "";
            if (a.type === "session") {
              const isLogin = String(a.sessionType) === "login";
              return (
                <div key={idx} className="flex items-start justify-between gap-4 rounded-[5px] border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={cn("mt-0.5 h-9 w-9 rounded-[5px] flex items-center justify-center border", isLogin ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-700 border-slate-200")}>
                      {isLogin ? <LogIn size={16} /> : <LogOut size={16} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-slate-900 truncate">
                        {a?.employee?.name || a?.employee?.email || "Employee"} {isLogin ? "logged in" : "logged out"}
                      </div>
                      <div className="text-xs text-slate-500 font-medium truncate">{a?.employee?.email || ""}</div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">{at}</div>
                </div>
              );
            }

            return (
              <div key={idx} className="flex items-start justify-between gap-4 rounded-[5px] border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 h-9 w-9 rounded-[5px] bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center">
                    <ArrowLeftRight size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-900 truncate">
                      Lead assigned: {a?.phone || "-"}
                    </div>
                    <div className="text-xs text-slate-500 font-medium truncate">
                      {(a?.toEmployee?.name || a?.toEmployee?.email || "Employee") + (a?.mode ? ` • ${a.mode}` : "")}
                    </div>
                    {a?.reason ? <div className="mt-1 text-[11px] text-slate-500 font-semibold truncate">Reason: {a.reason}</div> : null}
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">{at}</div>
              </div>
            );
          })}

          {!loading && recent.length === 0 ? (
            <div className="rounded-[5px] border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500">
              No recent activity.
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
