import React from "react";
import { cn } from "@shared/utils/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[5px] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md",
        className
      )}
      {...props}
    />
  );
}
