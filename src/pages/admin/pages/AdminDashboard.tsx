import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { motion } from "framer-motion";
import { Alert } from "@components/ui/Alert";
import { Card } from "@components/ui/Card";
import { AdminDashboardSkeleton } from "@pages/admin/components/AdminSkeletons";
import { Users, Shield, MessageSquare, FileText, Activity, Zap, TrendingUp } from "lucide-react";
import { cn } from "@shared/utils/cn";
import { useAuth } from "@shared/providers/AuthContext";
import { RecentActivityCard, Stat } from "./dashboard/AdminDashboardParts";

type DailyRow = { date: string; count: number };
type Point = { label: string; count: number; sent: number; delivered: number };

type AdminOverview = {
  users?: number;
  workspaces?: number;
  templates?: number;
  outboundMessages?: number;
  deliveredMessages?: number;
  readMessages?: number;
};

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
        const fallbackRecent = Array.isArray(ov?.recentActivity) ? ov.recentActivity : [];

        if (!canViewNotifications) {
          setFeed(fallbackRecent);
          return;
        }

        const notificationsResult = results[1];
        if (notificationsResult?.status === "fulfilled") {
          const items = Array.isArray(notificationsResult.value?.items) ? notificationsResult.value.items : [];
          setFeed(items.length ? items : fallbackRecent);
        } else {
          setFeed(fallbackRecent);
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
    () =>
      (daily || []).map((d: any) => ({
        label: String(d?.date || ""),
        count: Number(d?.count || 0),
        sent: Number(d?.sent || d?.count || 0),
        delivered: Number(d?.delivered || 0),
      })),
    [daily]
  );

  const chartPoints: Point[] = useMemo(() => {
    if (range === "today") return points.slice(-24);
    if (range === "30d") return points.slice(-30);
    return points.slice(-7);
  }, [points, range]);

  const graphData = chartPoints.map((p) => ({
    label: p.label,
    val: p.sent,
    delivered: p.delivered,
  }));

  const getPath = (data: Array<{ val: number; delivered: number }>, key: "val" | "delivered", height: number, width: number) => {
    if (data.length < 2) return "";
    const maxVal = Math.max(...data.map((x) => Number(x?.[key] || 0)), 1);
    const pathPoints = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (d[key] / maxVal) * (height * 0.85);
      return { x, y };
    });
    return pathPoints.reduce((acc, point, i, a) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      const prev = a[i - 1];
      const cx1 = prev.x + (point.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (point.x - prev.x) / 2;
      const cy2 = point.y;
      return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${point.x},${point.y}`;
    }, "");
  };

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
            <div className="relative z-10 mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-black text-slate-900">Campaign Activity</h3>
                <p className="mt-0.5 text-xs md:text-sm text-slate-500 font-medium">Real-time message delivery tracking</p>
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
                      "px-4 py-1.5 text-[11px] font-bold rounded-[5px] transition-all",
                      range === f.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
              {range === "today" ? "Today outbound" : range === "30d" ? "Last 30 days outbound" : "Last 7 days outbound"}
            </div>
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className="w-full border-t border-slate-300" />)}
            </div>
            {graphData.length ? (
              <>
                <div className="relative min-h-[220px]">

                  <svg viewBox="0 0 800 250" preserveAspectRatio="none" className="relative z-10 h-[220px] w-full overflow-visible">
                    <path d={`${getPath(graphData, "val", 250, 800)} L 800,250 L 0,250 Z`} className="fill-brand-500/5" />
                    <path d={`${getPath(graphData, "delivered", 250, 800)} L 800,250 L 0,250 Z`} className="fill-brand-500/10" />

                    <motion.path
                      key={`admin-sent-${range}`}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      d={getPath(graphData, "val", 250, 800)}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      className="text-slate-300"
                    />
                    <motion.path
                      key={`admin-delivered-${range}`}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                      d={getPath(graphData, "delivered", 250, 800)}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="text-brand-600"
                    />
                  </svg>

                  <div className="absolute inset-0 z-20 flex">
                    {graphData.map((d, i) => {
                      const maxVal = Math.max(...graphData.map((x) => Math.max(Number(x?.val || 0), Number(x?.delivered || 0))), 1);
                      const delY = 250 - (Number(d.delivered || 0) / maxVal) * (250 * 0.85);
                      return (
                        <div key={i} className="group relative flex-1">
                          <div className="absolute inset-y-0 left-0 w-full transition-colors hover:bg-brand-500/[0.02]" />
                          <div
                            className="absolute z-30 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-600 bg-white opacity-0 transition-all group-hover:opacity-100"
                            style={{ left: "50%", top: `${delY}px` }}
                          />
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-4 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-[5px] border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] text-white opacity-0 shadow-2xl transition-all group-hover:translate-y-0 group-hover:opacity-100">
                            <div className="mb-1 border-b border-slate-700 pb-1 font-black">{d.label}</div>
                            <div className="mt-1 space-y-1">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-400">Sent Volume:</span>
                                <span className="font-black">{d.val}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-brand-400">Delivered:</span>
                                <span className="font-black text-brand-400">{d.delivered}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-1 text-[9px]">
                                <span className="uppercase tracking-tighter text-slate-500">Success Rate</span>
                                <span className="font-bold text-emerald-400">
                                  {Math.round((Number(d.delivered || 0) / Math.max(1, Number(d.val || 0))) * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="relative z-20 mt-6 overflow-hidden px-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 md:text-[10px]">
                  <div
                    className="grid items-center"
                    style={{ gridTemplateColumns: `repeat(${Math.max(graphData.length, 1)}, minmax(0, 1fr))` }}
                  >
                    {graphData.map((d, i) => (
                      <span
                        key={i}
                        className={cn(
                          "whitespace-nowrap px-0.5 text-center transition-opacity truncate",
                          range === "today"
                            ? i % 3 !== 0
                              ? "opacity-0 md:opacity-100"
                              : "opacity-100"
                            : i % 2 !== 0
                              ? "opacity-0 md:opacity-100"
                              : "opacity-100"
                        )}
                      >
                        {d.label}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs font-semibold text-slate-400">No data.</div>
            )}
          </div>
        </Card>

        {canViewNotifications ? <RecentActivityCard feed={feed} /> : null}
      </div>
    </div>
  );
}
