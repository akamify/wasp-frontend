import { Loader2 } from "lucide-react";

type Props = {
  enabled: boolean;
  busy?: boolean;
  onToggle: (next: boolean) => void;
};

export function PlatformAddonToggle({ enabled, busy, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!enabled)}
      disabled={!!busy}
      className={`inline-flex h-8 w-16 items-center rounded-full border px-1 transition ${
        enabled ? "border-emerald-200 bg-emerald-100" : "border-slate-200 bg-slate-200"
      } ${busy ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
      aria-label={enabled ? "Disable add-on" : "Enable add-on"}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-black text-slate-600 shadow ${
          enabled ? "translate-x-8" : "translate-x-0"
        } transition`}
      >
        {busy ? <Loader2 className="size-3 animate-spin" /> : enabled ? "Y" : "N"}
      </span>
    </button>
  );
}
