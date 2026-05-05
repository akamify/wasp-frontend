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
}: {
  children: React.ReactNode;
  tone?: AlertTone;
}) {
  return (
    <div className={`rounded-[24px] px-4 py-3 text-sm ring-1 ${TONE_STYLES[tone]}`}>
      {children}
    </div>
  );
}
