import React from "react";

type AlertTone = "error" | "success" | "info" | "warn";

const TONE_STYLES: Record<AlertTone, string> = {
  error: "bg-red-50 text-red-800 ring-red-200",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  info: "bg-blue-50 text-blue-800 ring-blue-200",
  warn: "bg-amber-50 text-amber-900 ring-amber-200",
};

export function Alert({
  children,
  tone = "error",
  variant,
  className,
}: {
  children: React.ReactNode;
  tone?: AlertTone;
  // Back-compat alias used by some admin pages.
  variant?: "danger" | "success" | "info" | "warning";
  className?: string;
}) {
  const resolvedTone: AlertTone =
    variant === "success"
      ? "success"
      : variant === "info"
        ? "info"
        : variant === "warning"
          ? "warn"
          : variant === "danger"
            ? "error"
            : tone;
  return (
    <div className={`rounded-[5px] px-4 py-3 text-sm ring-1 ${TONE_STYLES[resolvedTone]} ${className || ""}`}>
      {children}
    </div>
  );
}
