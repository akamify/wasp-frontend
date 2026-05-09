import React from "react";
import { cn } from "../../utils/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  icon?: React.ReactNode;
};

export function Input({ className, label, hint, id, icon, ...props }: Props) {
  const inputId = id || React.useId();
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full rounded-[5px] bg-white border border-slate-200 py-2.5 text-sm text-slate-900 transition-all " +
            "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
            icon ? "pl-11 pr-4" : "px-4",
            className
          )}
          {...props}
        />
      </div>
      {hint && <p className="text-[11px] text-slate-500 ml-1">{hint}</p>}
    </div>
  );
}
