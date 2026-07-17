import { RefreshCw, Plus } from "lucide-react";
import { Button } from "@components/ui/Button";
import { cn } from "@shared/utils/cn";

export function DashboardHeader({
  syncing,
  loading,
  onSync,
  onNewCampaign,
}: {
  syncing: boolean;
  loading: boolean;
  onSync: () => void;
  onNewCampaign: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
      {/* Title Section */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tighter text-slate-950">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500 font-medium tracking-wide">
          Welcome back, here's what's happening.
        </p>
      </div>

      {/* Action Section */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={onSync}
          disabled={loading || syncing}
          className={cn(
            "rounded-xl border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm",
            "h-11 px-5 font-semibold text-slate-700"
          )}
        >
          <RefreshCw 
            size={16} 
            className={cn("mr-2 transition-transform duration-700", syncing && "animate-spin")} 
          />
          {syncing ? "Syncing..." : "Sync Data"}
        </Button>

        <Button 
          size="lg" 
          onClick={onNewCampaign} 
          className={cn(
            "rounded-xl h-11 px-5 font-semibold shadow-lg shadow-emerald-500/20",
            "bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-95"
          )}
        >
          <Plus size={18} className="mr-2" />
          <span>New Campaign</span>
        </Button>
      </div>
    </div>
  );
}