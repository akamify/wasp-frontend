import type { ReactNode } from "react";
import { ChevronRight, Settings2, X } from "lucide-react";
import { cn } from "@shared/utils/cn";

interface SettingsSidebarProps {
  open: boolean;
  width: number;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onOpen: () => void;
  children: ReactNode;
}

export function SettingsSidebar({
  open,
  width,
  title,
  subtitle,
  onClose,
  onOpen,
  children,
}: Readonly<SettingsSidebarProps>) {
  return (
    <>
      {open ? (
        <button
          type="button"
          className="absolute inset-0 z-30 bg-slate-950/20 backdrop-blur-[1px] focus-visible:outline-none lg:hidden"
          onClick={onClose}
          aria-label="Close settings panel"
          title="Close settings panel"
        />
      ) : null}
      <aside
        className={cn(
          "absolute inset-y-0 right-0 z-40 flex w-[min(360px,92vw)] flex-col overflow-hidden border-l border-slate-200 bg-white shadow-xl transition-transform duration-200 ease-out lg:relative lg:z-20 lg:w-0 lg:shrink-0 lg:shadow-none lg:transition-[width]",
          open ? "translate-x-0 lg:w-[var(--settings-width)]" : "translate-x-full lg:translate-x-0"
        )}
        style={{ "--settings-width": `${width}px` } as React.CSSProperties}
        aria-hidden={!open}
      >
        {open ? (
          <>
            <div className="flex h-14 w-[min(360px,92vw)] shrink-0 items-center gap-3 border-b border-slate-100 px-4 lg:w-[var(--settings-width)]">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-slate-900">{title}</div>
                {subtitle ? (
                  <div className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">
                    {subtitle}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Close settings panel"
                title="Close settings panel"
              >
                <ChevronRight size={17} className="hidden lg:block" />
                <X size={17} className="lg:hidden" />
              </button>
            </div>
            <div className="w-[min(360px,92vw)] flex-1 overflow-y-auto p-5 custom-scrollbar lg:w-[var(--settings-width)]">
              {children}
            </div>
          </>
        ) : null}
      </aside>
      {!open ? (
        <button
          type="button"
          onClick={onOpen}
          className="absolute right-4 top-4 z-20 flex h-9 items-center gap-2 rounded-[7px] border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-lg transition hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label="Open settings panel"
          title="Open settings panel"
        >
          <Settings2 size={15} />
          <span className="hidden sm:inline">Settings</span>
        </button>
      ) : null}
    </>
  );
}
