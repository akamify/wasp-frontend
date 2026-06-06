import { SkeletonBar } from "@shared/ui/skeletons/primitives";

export function AttributesSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <SkeletonBar className="h-10 w-48 rounded-[5px]" />
          <SkeletonBar className="h-4 w-[min(560px,70vw)] rounded-[5px]" />
        </div>
        <SkeletonBar className="h-11 w-40 rounded-[5px]" />
      </div>
      <SkeletonBar className="h-24 w-full rounded-[12px]" />
      <div className="overflow-hidden rounded-[5px] border border-slate-100 bg-white">
        <div className="border-b border-slate-100 p-4"><SkeletonBar className="h-11 w-full max-w-md rounded-[5px]" /></div>
        <div className="space-y-0 divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[1.2fr_1fr_1fr_90px_110px] gap-5 px-5 py-5">
              <SkeletonBar className="h-4 w-28 rounded-[5px]" />
              <SkeletonBar className="h-4 w-32 rounded-[5px]" />
              <SkeletonBar className="h-4 w-24 rounded-[5px]" />
              <SkeletonBar className="h-6 w-14 rounded-full" />
              <SkeletonBar className="h-8 w-24 rounded-[5px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
