import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { AlertTriangle, Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function CrmLockedPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-24">
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">CRM</div>
        <h1 className="mt-1 text-3xl md:text-4xl font-black tracking-tighter text-slate-900">
          CRM Access Required
        </h1>
        <p className="mt-2 text-slate-500 font-medium">
          This workspace doesn’t have CRM enabled. Please upgrade your plan or ask admin to enable CRM permission for this workspace.
        </p>
      </div>

      <Card className="p-6 border-slate-200 shadow-sm rounded-[5px] overflow-hidden relative">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-500/10 blur-2xl" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="h-10 w-10 rounded-[5px] bg-amber-50 text-amber-800 flex items-center justify-center">
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Lock size={16} /> CRM is locked
            </div>
            <div className="mt-1 text-xs text-slate-500 font-medium">
              CRM features work only when <span className="font-black text-slate-700">workspace.crmEnabled</span> is <span className="font-black">true</span>.
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link to="/app/plan">
                <Button className="gap-2">
                  Upgrade plan <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/app/settings">
                <Button variant="ghost">Back to Settings</Button>
              </Link>
              <Link to="/app">
                <Button variant="ghost">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

