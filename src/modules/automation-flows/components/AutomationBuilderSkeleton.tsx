import { SkeletonBar } from "@shared/ui/Skeletons";

interface AutomationBuilderSkeletonProps {
  leftCollapsed: boolean;
  rightOpen: boolean;
  leftWidth: number;
  rightWidth: number;
}

export function AutomationBuilderSkeleton({
  leftCollapsed,
  rightOpen,
  leftWidth,
  rightWidth,
}: Readonly<AutomationBuilderSkeletonProps>) {
  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden bg-white"
      aria-busy="true"
      aria-label="Loading automation builder"
    >
      <div className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 px-4">
        <SkeletonBar className="h-8 w-8 rounded-[6px]" />
        <SkeletonBar className="h-5 w-48 rounded-[5px]" />
        <SkeletonBar className="h-6 w-16 rounded-full" />
        <div className="ml-auto flex gap-2">
          <SkeletonBar className="h-9 w-24 rounded-[6px]" />
          <SkeletonBar className="h-9 w-20 rounded-[6px]" />
          <SkeletonBar className="h-9 w-20 rounded-[6px]" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <aside
          className="hidden shrink-0 border-r border-slate-200 p-3 lg:block"
          style={{ width: leftCollapsed ? 72 : leftWidth }}
        >
          {leftCollapsed ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonBar key={index} className="mx-auto h-10 w-10 rounded-[7px]" />
              ))}
            </div>
          ) : (
            <>
              <SkeletonBar className="h-4 w-32 rounded-[5px]" />
              <SkeletonBar className="mt-3 h-8 w-full rounded-[6px]" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 7 }).map((_, index) => (
                  <SkeletonBar key={index} className="h-14 w-full rounded-[8px]" />
                ))}
              </div>
            </>
          )}
        </aside>
        <div className="relative min-w-0 flex-1 overflow-hidden bg-slate-50">
          <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]" />
          <SkeletonBar className="absolute left-[12%] top-[22%] h-24 w-48 rounded-[10px]" />
          <SkeletonBar className="absolute left-[42%] top-[42%] h-28 w-56 rounded-[10px]" />
          <SkeletonBar className="absolute left-[68%] top-[20%] h-24 w-48 rounded-[10px]" />
          <SkeletonBar className="absolute bottom-4 left-4 h-10 w-24 rounded-[6px]" />
        </div>
        {rightOpen ? (
          <aside
            className="hidden shrink-0 border-l border-slate-200 p-5 lg:block"
            style={{ width: rightWidth }}
          >
            <SkeletonBar className="h-4 w-28 rounded-[5px]" />
            <div className="mt-6 space-y-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index}>
                  <SkeletonBar className="h-3 w-24 rounded-[5px]" />
                  <SkeletonBar className="mt-2 h-10 w-full rounded-[6px]" />
                </div>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
