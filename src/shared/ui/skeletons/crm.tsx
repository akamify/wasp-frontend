import { SkeletonBar } from "./primitives";

export function CrmDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-24">
      <div className="grid gap-3">
        <SkeletonBar className="h-3 w-16 rounded-[5px]" />
        <SkeletonBar className="h-10 w-56 rounded-[5px]" />
        <SkeletonBar className="h-4 w-80 rounded-[5px]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonBar key={i} className="h-24 rounded-[5px]" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <SkeletonBar className="h-80 rounded-[5px] lg:col-span-2" />
        <SkeletonBar className="h-80 rounded-[5px]" />
      </div>
      <SkeletonBar className="h-64 rounded-[5px]" />
    </div>
  );
}

export function CrmEmployeesSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-24">
      <div className="grid gap-3">
        <SkeletonBar className="h-3 w-16 rounded-[5px]" />
        <SkeletonBar className="h-10 w-56 rounded-[5px]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonBar key={i} className="h-24 rounded-[5px]" />)}
      </div>
      <SkeletonBar className="h-[420px] rounded-[5px]" />
    </div>
  );
}

export function CrmLeadsSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-24">
      <div className="grid gap-3">
        <SkeletonBar className="h-3 w-16 rounded-[5px]" />
        <SkeletonBar className="h-10 w-40 rounded-[5px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonBar className="h-20 rounded-[5px] md:col-span-2" />
        <SkeletonBar className="h-20 rounded-[5px]" />
      </div>
      <SkeletonBar className="h-[420px] rounded-[5px]" />
    </div>
  );
}

export function CrmEmployeeProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-24">
      <div className="grid gap-3">
        <SkeletonBar className="h-3 w-16 rounded-[5px]" />
        <SkeletonBar className="h-10 w-64 rounded-[5px]" />
        <SkeletonBar className="h-4 w-80 rounded-[5px]" />
      </div>
      <SkeletonBar className="h-16 rounded-[5px]" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonBar key={i} className="h-24 rounded-[5px]" />)}
      </div>
      <SkeletonBar className="h-[420px] rounded-[5px]" />
    </div>
  );
}
