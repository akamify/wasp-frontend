import React from "react";
import { cn } from "../../utils/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ className, variant = "primary", size = "md", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[5px] px-4 py-2 text-sm font-semibold transition " +
    "ring-1 ring-transparent hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 " +
    "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0";
  const variants: Record<string, string> = {
    primary:
      "bg-[linear-gradient(135deg,#86ffd2,#2ef7b3)] text-ink-900",
    ghost:
      "bg-white text-ink-900 ring-1 ring-ink-900/12 hover:ring-ink-900/18 hover:bg-brand-50/60",
    danger:
      "bg-[#ef4444] text-white",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-2 text-sm",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
