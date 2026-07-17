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
  const completedSteps = steps.filter((s) => s.done).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <Card 
      className={cn(
        "relative overflow-hidden border border-slate-100 bg-white shadow-sm transition-all duration-300 rounded-xl", 
        !stepsExpanded && "p-4"
      )}
    >
      <div className={cn("p-6", !stepsExpanded && "p-0")}>
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 ring-4 ring-emerald-50/50">
              <Zap size={18} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Quick Setup Guide</h3>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs text-slate-500 font-medium whitespace-nowrap">
                  {completedSteps} of {totalSteps} completed
                </p>
                {/* Modern subtle progress indicator */}
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500 ease-out rounded-full" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={onToggle} 
            className="p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg transition-all text-slate-400 hover:text-slate-600"
          >
            {stepsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {/* Steps Grid */}
        {stepsExpanded && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mt-6">
            {steps.map((step, idx) => (
              <Link 
                key={step.id} 
                to={step.done ? "#" : step.href} 
                className={cn(
                  "group relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 active:scale-[0.98]", 
                  step.done 
                    ? "bg-slate-50/60 border-slate-100 text-slate-400 pointer-events-none" 
                    : "bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/5"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    {step.done ? (
                      <div className="p-0.5 bg-emerald-500 rounded-full text-white">
                        <CheckCircle2 size={14} className="stroke-[3]" />
                      </div>
                    ) : (
                      <div className="text-slate-300 group-hover:text-emerald-500 transition-colors">
                        <Circle size={14} className="stroke-[2.5]" />
                      </div>
                    )}
                    <span className="text-[10px] font-bold tracking-wider text-slate-400/70">
                      STEP 0{idx + 1}
                    </span>
                  </div>
                  
                  <div className={cn(
                    "text-xs font-semibold leading-snug transition-colors", 
                    step.done ? "text-slate-400 line-through decoration-slate-200" : "text-slate-800 group-hover:text-emerald-600"
                  )}>
                    {step.label}
                  </div>
                </div>

                {!step.done && (
                  <div className="flex justify-end mt-4">
                    <ArrowRight 
                      size={14} 
                      className="text-emerald-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" 
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}