import React from "react";
import { cn } from "../../utils/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[5px] border border-ink-900/10 bg-white ring-1 ring-ink-900/5",
        className
      )}
      {...props}
    />
  );
}
