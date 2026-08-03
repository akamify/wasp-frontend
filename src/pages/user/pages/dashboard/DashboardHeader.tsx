import { Plus, RefreshCw, Sparkles, WalletCards } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { cn } from "@shared/utils/cn";

type DashboardHeaderProps = {
  syncing: boolean;
  loading: boolean;
  onSync: () => void;
  onNewCampaign: () => void;
};

export function DashboardHeader({
  syncing,
  loading,
  onSync,
  onNewCampaign,
}: DashboardHeaderProps) {
  const isBusy = syncing || loading;

  return (
    <Card
      className={cn(
        "group relative isolate overflow-hidden rounded-[2px]",
        "border border-emerald-900/10",
        "bg-[linear-gradient(125deg,#07362f_0%,#0d7669_48%,#18b98b_100%)]",
        "p-5 text-white sm:p-6 lg:p-7",
        "shadow-[0_24px_65px_-36px_rgba(5,78,63,0.72)]",
      )}
    >
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_92%_4%,rgba(255,255,255,0.18),transparent_28%)]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_100%,rgba(255,255,255,0.1),transparent_34%)]" />

        <div className="absolute -right-24 -top-28 size-80 rounded-full bg-emerald-200/10 blur-3xl" />

        <div className="absolute -bottom-32 left-[38%] size-72 rounded-full bg-teal-950/15 blur-3xl" />

        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:42px_42px]" />
      </div>

      <div className="relative flex min-w-0 flex-col gap-7 xl:flex-row xl:items-start xl:justify-between">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md">
            <Sparkles size={13} className="shrink-0 text-emerald-100" />

            <span className="truncate text-[10px] font-black uppercase tracking-[0.22em] text-emerald-50 sm:text-[11px]">
              Performance snapshot
            </span>
          </div>

          <div className="mt-5">
            <h1 className="text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">
              Dashboard
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-emerald-50/80 sm:text-[15px] sm:leading-7">
              Monitor delivery health, workspace readiness and WhatsApp
              performance from one command center.
            </p>
          </div>

          {/* Status cards */}
          <div className="mt-6 grid max-w-[520px] gap-3 sm:grid-cols-2">
            <DashboardMetric
              label="Workspace health"
              value="Live and ready"
              status
            />

            <DashboardMetric
              label="Wallet and billing"
              value="Connected"
              icon={<WalletCards size={17} />}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row xl:shrink-0 xl:self-start">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onSync}
            disabled={isBusy}
            aria-busy={isBusy}
            className={cn(
              "h-11 w-full min-w-[170px] justify-center gap-2 rounded-[2px] px-5",
              "!border-white/20 !bg-white/10 !text-white",
              "font-black shadow-none backdrop-blur-md",
              "transition-all duration-200",
              "hover:-translate-y-0.5 hover:!border-white/30 hover:!bg-white/15 hover:!text-white",
              "active:translate-y-0",
              "disabled:pointer-events-none disabled:!border-white/10",
              "disabled:!bg-white/[0.06] disabled:!text-white/60",
              "[&_svg]:!text-white",
            )}
          >
            <RefreshCw
              size={16}
              className={cn("shrink-0", syncing && "animate-spin")}
            />

            <span>{syncing ? "Refreshing..." : "Refresh dashboard"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onNewCampaign}
            className={cn(
              "h-11 w-full min-w-[150px] justify-center gap-2 rounded-[2px] px-5",
              "!border-white !bg-white !text-emerald-950",
              "font-black shadow-[0_14px_34px_-18px_rgba(3,47,39,0.65)]",
              "transition-all duration-200",
              "hover:-translate-y-0.5 hover:!border-emerald-50 hover:!bg-emerald-50 hover:!text-emerald-950",
              "active:translate-y-0",
              "[&_svg]:!text-emerald-950",
            )}
          >
            <Plus size={17} className="shrink-0" />
            <span>New Campaign</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function DashboardMetric({
  label,
  value,
  icon,
  status = false,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  status?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[2px] border border-white/12",
        "bg-white/10 px-4 py-3.5 backdrop-blur-md",
        "transition-all duration-200",
        "hover:border-white/20 hover:bg-white/[0.14]",
      )}
    >
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-50/60">
        {label}
      </div>

      <div className="mt-2 flex min-w-0 items-center gap-2">
        {status ? (
          <span className="relative flex size-2.5 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-200 opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-200" />
          </span>
        ) : null}

        {icon ? (
          <span className="shrink-0 text-emerald-100">{icon}</span>
        ) : null}

        <span className="truncate text-base font-black text-white sm:text-lg">
          {value}
        </span>
      </div>
    </div>
  );
}
