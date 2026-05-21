import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Card } from "@components/ui/Card";
import { AdminDashboardSkeleton } from "@pages/admin/components/AdminSkeletons";
import { Users, Shield, MessageSquare, FileText, Activity, Zap, TrendingUp } from "lucide-react";
import { cn } from "@shared/utils/cn";
import { AdminLineChart, AdminChartLabels } from "@pages/admin/components/AdminMiniChart";
import { useAuth } from "@shared/providers/AuthContext";

type DailyRow = { date: string; count: number };
type Point = { label: string; count: number };

type AdminOverview = {
  users?: number;
  workspaces?: number;
  templates?: number;
  outboundMessages?: number;
  deliveredMessages?: number;
  readMessages?: number;
};

function Stat({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  bg: string;
}) {
  return (
    <Card className="relative overflow-hidden rounded-[5px] border-slate-200 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className={cn("absolute -mr-12 -mt-12 h-24 w-24 rounded-full opacity-50 blur-3xl", bg)} />
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <h3 className="text-3xl font-black tracking-tight text-slate-900">{value}</h3>
        </div>
        <div className={cn("rounded-[5px] p-3 transition-transform group-hover:scale-110", bg, color)}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"today" | "week" | "30d">("week");

  const canViewNotifications = useMemo(() => {
    if (String(user?.role || "") === "super_admin") return true;
    const pages = Array.isArray(user?.permissions?.pages) ? user.permissions.pages : [];
    return pages.includes("/admin/notifications");
  }, [user]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const tasks: Promise<any>[] = [API.admin.overview({ range })];
    if (canViewNotifications) tasks.push(API.admin.notifications({ page: 1, limit: 6, q: "" }));

    Promise.allSettled(tasks)
      .then((results: any[]) => {
        if (!active) return;

        const overviewResult = results[0];
        if (overviewResult?.status !== "fulfilled") throw overviewResult?.reason;

        const ov = overviewResult.value;
        setOverview(ov?.overview || null);
        setDaily(Array.isArray(ov?.dailyMessages) ? ov.dailyMessages : []);

        if (!canViewNotifications) {
          setFeed([]);
          return;
        }

        const notificationsResult = results[1];
        if (notificationsResult?.status === "fulfilled") {
          setFeed(Array.isArray(notificationsResult.value?.items) ? notificationsResult.value.items : []);
        } else {
          setFeed([]);
        }
      })
      .catch((e: any) => {
        if (!active) return;
        setError(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to load admin dashboard");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [range, canViewNotifications]);

  const points: Point[] = useMemo(
    () => (daily || []).map((d: any) => ({ label: String(d?.date || ""), count: Number(d?.count || 0) })),
    [daily]
  );

  const chartPoints: Point[] = useMemo(() => {
    if (range === "today") return points.slice(-24);
    if (range === "30d") return points.slice(-30);
    return points.slice(-7);
  }, [points, range]);

  const stats = useMemo(
    () => [
      { label: "Total Users", value: overview?.users || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
      { label: "Workspaces", value: overview?.workspaces || 0, icon: Shield, color: "text-purple-600", bg: "bg-purple-50" },
      {
        label: "Messages",
        value: overview?.outboundMessages || 0,
        icon: MessageSquare,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
      },
      { label: "Templates", value: overview?.templates || 0, icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
    ],
    [overview]
  );

  if (loading && !overview) return <AdminDashboardSkeleton />;

  return (
    <div className="flex flex-col gap-8 p-4 pb-20 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 md:text-4xl">Admin Dashboard</h1>
          <p className="mt-1 font-medium text-slate-500">Global platform overview and message delivery metrics.</p>
        </div>
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Stat key={s.label} {...s} value={loading ? "..." : s.value.toLocaleString()} />
        ))}
      </div>

      <div className={cn("grid gap-8", canViewNotifications ? "lg:grid-cols-3" : "lg:grid-cols-1")}>
        <Card
          className={cn(
            "relative overflow-hidden rounded-[5px] border-slate-200 p-8 shadow-sm",
            canViewNotifications ? "lg:col-span-2" : "lg:col-span-1"
          )}
        >
          <div className="absolute right-0 top-0 -mr-32 -mt-32 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
          <div className="relative z-10 mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900">Delivery Performance</h3>
              <p className="mt-0.5 text-sm font-medium text-slate-500">Real-time message success metrics across all workspaces.</p>
            </div>
            <div className="flex rounded-[5px] bg-slate-100 p-1">
              {[
                { key: "today", label: "Today" },
                { key: "week", label: "Last 7 Days" },
                { key: "30d", label: "30 Days" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setRange(f.key as any)}
                  className={cn(
                    "rounded-[5px] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                    range === f.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative z-10 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Total Sent", value: overview?.outboundMessages, icon: Zap, color: "text-slate-600", bg: "bg-slate-50" },
              { label: "Delivered", value: overview?.deliveredMessages, icon: Activity, color: "text-brand-600", bg: "bg-brand-50" },
              { label: "Read Rate", value: overview?.readMessages, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
            ].map((metric, i) => (
              <div key={i} className="group rounded-[5px] border border-slate-100 bg-white p-6 shadow-sm transition-colors hover:border-brand-200">
                <div className={cn("mb-4 w-fit rounded-[5px] p-2 transition-transform group-hover:scale-110", metric.bg, metric.color)}>
                  <metric.icon size={18} />
                </div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{metric.label}</p>
                <h4 className="text-2xl font-black text-slate-900">{metric.value?.toLocaleString() || 0}</h4>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <div className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
              {range === "today" ? "Today outbound" : range === "30d" ? "Last 30 days outbound" : "Last 7 days outbound"}
            </div>
            {chartPoints.length ? (
              <>
                <AdminLineChart points={chartPoints} height={120} className="mt-4" />
                <AdminChartLabels points={chartPoints} />
              </>
            ) : (
              <div className="text-xs font-semibold text-slate-400">No data.</div>
            )}
          </div>
        </Card>

        {canViewNotifications ? (
          <Card className="rounded-[5px] border-slate-200 p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Recent Activity</h3>
              <span className="rounded-[4px] bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-600">Events</span>
            </div>
            <div className="space-y-4">
              {feed.length ? (
                feed.map((e: any) => (
                  <div key={e.id} className="group flex gap-4 rounded-[5px] border border-transparent p-3 transition-colors hover:border-slate-100 hover:bg-slate-50">
                    <div
                      className={cn(
                        "mt-1 shrink-0 rounded-[5px] p-2 transition-transform group-hover:scale-110",
                        e.status === "failed" || e.status === "error" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      <Activity size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 truncate text-xs font-bold leading-tight text-slate-800">{e.eventName || "Event"}</p>
                      <p className="text-[10px] font-medium text-slate-400">
                        {(e.workspace?.name || "System") + " - " + (e.createdAt ? new Date(e.createdAt).toLocaleString() : "")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs font-semibold text-slate-400">No recent events.</div>
              )}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
