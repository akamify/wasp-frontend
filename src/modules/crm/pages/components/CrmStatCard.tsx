import { Card } from "@components/ui/Card";
import { cn } from "@shared/utils/cn";

export function CrmStatCard({
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
