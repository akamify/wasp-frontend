import React from "react";
import { cn } from "../../utils/cn";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { className, label, hint, id, ...props },
  ref
) {
  const textareaId = id || React.useId();
  return (
    <label className="block">
      {label ? (
        <div className="mb-1 text-xs font-semibold text-ink-800/80">{label}</div>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        className={cn(
          "w-full min-h-24 rounded-[5px] bg-white px-3 py-2.5 text-sm text-ink-900 ring-1 ring-ink-900/12 " +
            "placeholder:text-ink-900/35 focus:outline-none focus:ring-2 focus:ring-brand-300",
          className
        )}
        {...props}
      />
      {hint ? <div className="mt-1 text-xs text-ink-800/60">{hint}</div> : null}
    </label>
  );
});
