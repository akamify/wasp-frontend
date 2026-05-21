import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@shared/utils/cn";

export function Modal({
  open,
  isOpen,
  onClose,
  title,
  children,
  className,
}: {
  open?: boolean;
  // Back-compat alias used by some pages.
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const resolvedOpen = typeof isOpen === "boolean" ? isOpen : !!open;
  useEffect(() => {
    if (!resolvedOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resolvedOpen, onClose]);

  if (!resolvedOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        aria-label="Close modal"
      />
      <div className="absolute inset-0 flex items-start justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "w-full max-w-2xl overflow-hidden rounded-[5px] border border-slate-200 bg-white shadow-2xl",
            "mt-10 mb-10 max-h-[calc(100vh-5rem)]",
            className
          )}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
            <div className="min-w-0 truncate text-sm font-black text-slate-900">{title || ""}</div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[5px] p-2 text-slate-500 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div className="max-h-[calc(100vh-9rem)] overflow-y-auto p-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
