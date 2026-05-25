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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
      <div className="space-y-0.5">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-xs md:text-base text-slate-500 font-medium">Welcome back!</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={loading || syncing}
          className="flex-1 sm:flex-none rounded-[5px] h-9 md:h-10 px-3 md:px-4"
        >
          <RefreshCw size={14} className={cn("mr-2 transition-transform duration-700", syncing && "animate-spin")} />
          <span className="xs:inline">{syncing ? "Syncing..." : "Sync"}</span>
        </Button>
        <Button size="sm" onClick={onNewCampaign} className="flex-1 sm:flex-none rounded-[5px] h-9 md:h-10 px-3 md:px-4">
          <Plus size={14} className="mr-1.5" />
          <span>New Campaign</span>
        </Button>
      </div>
    </div>
  );
}
