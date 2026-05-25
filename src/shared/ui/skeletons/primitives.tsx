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
