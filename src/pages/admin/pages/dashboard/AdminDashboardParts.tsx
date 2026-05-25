import { Card } from "@components/ui/Card";
import { cn } from "@shared/utils/cn";

export function Stat({ label, value, icon: Icon, color, bg }: { label: string; value: string | number; icon: any; color: string; bg: string }) {
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

export function RecentActivityCard({ feed }: { feed: any[] }) {
  return (
    <Card className="rounded-[5px] border-slate-200 p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900">Recent Activity</h3>
        <span className="rounded-[4px] bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-600">Events</span>
      </div>
      <div className="space-y-4">
        {feed.length ? feed.map((e: any) => (
          <div key={e.id} className="group flex gap-4 rounded-[5px] border border-transparent p-3 transition-colors hover:border-slate-100 hover:bg-slate-50">
            <div className="min-w-0">
              <p className="mb-1 truncate text-xs font-bold leading-tight text-slate-800">{e.eventName || "Event"}</p>
              <p className="text-[10px] font-medium text-slate-400">{(e.workspace?.name || "System") + " - " + (e.createdAt ? new Date(e.createdAt).toLocaleString() : "")}</p>
            </div>
          </div>
        )) : <div className="text-xs font-semibold text-slate-400">No recent events.</div>}
      </div>
    </Card>
  );
}
