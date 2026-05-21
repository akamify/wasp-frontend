import React from "react";
import { cn } from "@shared/utils/cn";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "good" | "warn" | "bad" | "brand";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-700",
    good: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warn: "bg-amber-50 text-amber-700 border-amber-100",
    bad: "bg-rose-50 text-rose-700 border-rose-100",
    brand: "bg-brand-50 text-brand-700 border-brand-100",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[5px] border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
