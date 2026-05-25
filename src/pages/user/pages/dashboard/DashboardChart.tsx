import { motion } from "framer-motion";
import { Card } from "@components/ui/Card";
import { cn } from "@shared/utils/cn";

const FILTERS = ["Today", "Last 7 Days", "30 Days"] as const;

function getPath(data: any[], key: string, height: number, width: number) {
  if (data.length < 2) return "";
  const maxVal = Math.max(...data.map((x) => Number(x?.[key] || 0)), 1);
  const points = data.map((d, i) => ({ x: (i / (data.length - 1)) * width, y: height - (d[key] / maxVal) * (height * 0.85) }));
  return points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const prev = a[i - 1];
    const cx1 = prev.x + (point.x - prev.x) / 2;
    const cx2 = prev.x + (point.x - prev.x) / 2;
    return `${acc} C ${cx1},${prev.y} ${cx2},${point.y} ${point.x},${point.y}`;
  }, "");
}

export function DashboardChart({ chartFilter, setChartFilter, graphData }: any) {
  return (
    <Card className="p-3 md:p-8 border-ink-900/5 shadow-xl shadow-ink-900/5 relative overflow-hidden rounded-[5px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div><h3 className="text-lg md:text-xl font-black text-slate-900">Campaign Activity</h3><p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">Real-time message delivery tracking</p></div>
        <div className="flex bg-slate-100 rounded-[5px] p-1 self-start md:self-auto">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setChartFilter(f)} className={cn("px-4 py-1.5 text-[11px] font-bold rounded-[5px] transition-all", chartFilter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}>{f}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative min-h-[180px] md:min-h-[250px] mt-4 md:mt-0">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="w-full border-t border-slate-300" />)}</div>
        <svg viewBox="0 0 800 250" preserveAspectRatio="none" className="w-full h-[180px] md:h-[250px] overflow-visible relative z-10">
          <path d={`${getPath(graphData, "val", 250, 800)} L 800,250 L 0,250 Z`} className="fill-brand-500/5" />
          <path d={`${getPath(graphData, "delivered", 250, 800)} L 800,250 L 0,250 Z`} className="fill-brand-500/10" />
          <motion.path key={`val-${chartFilter}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} d={getPath(graphData, "val", 250, 800)} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-slate-300 md:stroke-[2]" />
          <motion.path key={`del-${chartFilter}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1, ease: "easeOut", delay: 0.1 }} d={getPath(graphData, "delivered", 250, 800)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-brand-600 md:stroke-[3.5]" />
        </svg>

        <div className="absolute inset-0 flex z-20">
          {graphData.map((d: any, i: number) => {
            const maxVal = Math.max(...graphData.map((x: any) => Math.max(Number(x?.val || 0), Number(x?.delivered || 0))), 1);
            const delY = 250 - (Number(d.delivered || 0) / maxVal) * (250 * 0.85);
            return (
              <div key={i} className="flex-1 group relative">
                <div className="absolute inset-y-0 left-0 w-full hover:bg-brand-500/[0.02] transition-colors" />
                <div className="absolute w-2.5 h-2.5 bg-white border-2 border-brand-600 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all z-30" style={{ left: "50%", top: `${delY}px` }} />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-slate-900 text-white text-[10px] px-3 py-2 rounded-[5px] opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-40 shadow-2xl border border-slate-700 whitespace-nowrap translate-y-1 group-hover:translate-y-0">
                  <div className="font-black mb-1 border-b border-slate-700 pb-1">{d.label}</div>
                  <div className="space-y-1 mt-1"><div className="flex items-center justify-between gap-4"><span className="text-slate-400">Sent Volume:</span><span className="font-black">{d.val}</span></div><div className="flex items-center justify-between gap-4"><span className="text-brand-400">Delivered:</span><span className="font-black text-brand-400">{d.delivered}</span></div><div className="flex items-center justify-between gap-4 text-[9px] pt-1 border-t border-slate-800"><span className="text-slate-500 uppercase tracking-tighter">Success Rate</span><span className="text-emerald-400 font-bold">{Math.round((Number(d.delivered || 0) / Math.max(1, Number(d.val || 0))) * 100)}%</span></div></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 px-1 md:px-2 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-20 overflow-hidden">
        <div className="grid items-center" style={{ gridTemplateColumns: `repeat(${Math.max(graphData.length, 1)}, minmax(0, 1fr))` }}>
          {graphData.map((d: any, i: number) => (
            <span key={i} className={cn("text-center transition-opacity whitespace-nowrap px-0.5 truncate", chartFilter === "Today" ? (i % 3 !== 0 ? "opacity-0 md:opacity-100" : "opacity-100") : (chartFilter === "30 Days" || chartFilter === "Last 7 Days") && i % 2 !== 0 ? "opacity-0 md:opacity-100" : "opacity-100")}>{d.label}</span>
          ))}
        </div>
      </div>
    </Card>
  );
}
