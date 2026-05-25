import { Link } from "react-router-dom";
import { cn } from "@shared/utils/cn";

export function DashboardActivity({ liveActivities }: { liveActivities: any[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Activity</h3>
        <Link to="/app/send" className="text-[10px] font-bold text-brand-600 hover:underline">View All</Link>
      </div>
      <div className="space-y-2">
        {liveActivities.length > 0 ? (
          liveActivities.map((act) => (
            <div key={act.id} className="flex gap-4 p-3 hover:bg-white rounded-[5px] border border-transparent hover:border-slate-100 transition-all group">
              <div className={cn("mt-1 size-2 rounded-full shrink-0 group-hover:animate-ping", act.color)} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 leading-tight mb-1">{act.title}</p>
                <p className="text-[10px] text-slate-400">{act.time}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-[5px] border border-dashed border-slate-200"><p className="text-xs text-slate-400">No recent activity</p></div>
        )}
      </div>
    </div>
  );
}
