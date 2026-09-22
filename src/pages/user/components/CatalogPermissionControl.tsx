import { ShieldCheck } from "lucide-react";
import { Button } from "@components/ui/Button";
import { cn } from "@shared/utils/cn";

export function CatalogPermissionControl({ connected, granted, catalogIds, busy, authorize }: {
  connected: boolean;
  granted: boolean;
  catalogIds: string[];
  busy: boolean;
  authorize: () => void;
}) {
  if (!connected) return null;
  return <div className="flex flex-col items-start gap-2">
    <Button
      type="button"
      variant="outline"
      className={cn(
        "h-12 min-w-[220px] justify-center gap-2 rounded-xl px-5 font-black",
        "!border-emerald-200 !bg-emerald-50 !text-emerald-900",
        "hover:!border-emerald-300 hover:!bg-emerald-100",
        "disabled:pointer-events-none disabled:opacity-60",
      )}
      onClick={authorize}
      disabled={busy}
    >
      <ShieldCheck size={17} />
      <span>{granted ? "Refresh catalog permission" : "Authorize catalog access"}</span>
    </Button>
    <span className={cn(
      "rounded-full px-3 py-1.5 text-xs font-bold",
      granted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900",
    )}>
      Catalog access: {granted ? "Granted" : "Authorization required"}
    </span>
    {!granted ? (
      <span className="max-w-sm text-xs font-semibold leading-5 text-amber-100">
        Meta configuration must include WhatsApp accounts and Catalogs assets, plus catalog management permission. In the authorization popup, select the exact catalog checkbox before continuing.
      </span>
    ) : null}
    {granted && catalogIds.length ? (
      <span className="max-w-sm text-xs font-semibold leading-5 text-emerald-100">
        Authorized catalog IDs: {catalogIds.join(", ")}
      </span>
    ) : null}
  </div>;
}
