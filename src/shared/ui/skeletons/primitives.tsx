export function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`skeleton-bar ${className}`} />;
}

export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return <div className="skeleton-bar flex-shrink-0" style={{ width: size, height: size, borderRadius: "5px" }} />;
}

export function SessionSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
      <div className="skeleton-bar h-10 w-10 rounded-[5px]" />
      <div className="flex w-full max-w-xs flex-col items-center gap-3">
        <SkeletonBar className="h-3 w-40 rounded-[5px]" />
        <SkeletonBar className="h-2.5 w-28 rounded-[5px]" />
      </div>
    </div>
  );
}

export function ContentAreaSkeleton() {
  return (
    <div className="flex min-h-[calc(100dvh-120px)] w-full items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-[18px] border border-slate-200 bg-white/90 px-6 py-10 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.5)]">
        <div className="skeleton-bar h-11 w-11 rounded-[12px]" />
        <div className="flex w-full flex-col items-center gap-3">
          <SkeletonBar className="h-4 w-40 rounded-[5px]" />
          <SkeletonBar className="h-3 w-28 rounded-[5px]" />
        </div>
      </div>
    </div>
  );
}
