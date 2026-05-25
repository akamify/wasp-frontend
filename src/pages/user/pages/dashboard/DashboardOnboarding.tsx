import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Circle, Zap } from "lucide-react";
import { Card } from "@components/ui/Card";
import { cn } from "@shared/utils/cn";

export function DashboardOnboarding({
  steps,
  stepsExpanded,
  onToggle,
}: {
  steps: any[];
  stepsExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className={cn("relative overflow-hidden border-brand-200 bg-gradient-to-br from-white to-brand-50/20 transition-all duration-300 rounded-[5px]", !stepsExpanded && "p-4 opacity-90")}>
      <div className={cn("p-6", !stepsExpanded && "p-0")}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-[5px] text-brand-600"><Zap size={20} fill="currentColor" /></div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Quick Setup Guide</h3>
              <p className="text-xs text-slate-500 font-medium">{steps.filter((s) => s.done).length} / {steps.length} steps completed</p>
            </div>
          </div>
          <button onClick={onToggle} className="p-2 hover:bg-white rounded-[5px] transition-colors text-slate-400 hover:text-slate-900">
            {stepsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {stepsExpanded && (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {steps.map((step) => (
              <Link key={step.id} to={step.done ? "#" : step.href} className={cn("group relative flex flex-col p-4 rounded-[5px] border transition-all duration-200", step.done ? "bg-white/50 border-emerald-100 text-slate-500" : "bg-white border-slate-200 hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/5")}>
                <div className="flex items-center justify-between mb-4">
                  {step.done ? <div className="p-1 bg-emerald-500 rounded-full text-white"><CheckCircle2 size={14} /></div> : <div className="p-1 bg-slate-100 rounded-full text-slate-300"><Circle size={14} /></div>}
                  <span className="text-[10px] font-black text-slate-300">STEP 0{step.id}</span>
                </div>
                <div className={cn("text-xs font-bold leading-tight", !step.done && "text-slate-900 group-hover:text-brand-600")}>{step.label}</div>
                {!step.done && <ArrowRight size={14} className="mt-3 text-brand-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
