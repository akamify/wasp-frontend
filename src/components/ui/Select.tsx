import React from "react";
import { cn } from "../../utils/cn";

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ className, label, id, children, ...props }: Props) {
  const selectId = id || React.useId();
  return (
    <label className="block">
      {label ? (
        <div className="mb-1 text-xs font-semibold text-ink-800/80">{label}</div>
      ) : null}
      <select
        id={selectId}
        className={cn(
          "w-full rounded-[5px] bg-white px-3 py-2.5 text-sm text-ink-900 ring-1 ring-ink-900/12 " +
            "focus:outline-none focus:ring-2 focus:ring-brand-300",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
