import { cn } from "@shared/utils/cn";
import { SkeletonBar, SkeletonCircle } from "./primitives";
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-8 pb-24 md:pb-12">
      {/* Header Section */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between md:gap-4">
        <div className="space-y-2 md:space-y-3">
          <SkeletonBar className="h-8 w-48 md:h-10 md:w-64 rounded-[5px]" />
          <SkeletonBar className="h-3 w-60 md:h-4 md:w-96 rounded-[5px] opacity-60" />
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <SkeletonBar className="h-9 w-28 md:h-10 md:w-32 rounded-[5px]" />
          <SkeletonBar className="h-9 w-32 md:h-10 md:w-40 rounded-[5px]" />
        </div>
      </div>

      {/* Onboarding Section */}
      <div className="rounded-[5px] border border-brand-100 bg-white p-4 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <SkeletonCircle size={36} />
            <div className="space-y-1.5 md:space-y-2">
              <SkeletonBar className="h-3.5 w-32 md:h-4 md:w-40 rounded-[5px]" />
              <SkeletonBar className="h-2 w-20 md:h-2.5 md:w-24 rounded-[5px] opacity-60" />
            </div>
          </div>
          <SkeletonBar className="h-7 w-7 md:h-8 md:w-8 rounded-[5px]" />
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn(
              "rounded-[5px] border border-slate-50 p-4 md:p-6 flex flex-col gap-3 md:gap-4 bg-slate-50/50",
              i >= 4 ? "hidden sm:flex" : "",
              i >= 3 ? "hidden sm:flex lg:flex" : ""
            )}>
              <div className="flex items-center justify-between">
                <SkeletonCircle size={20} />
                <SkeletonBar className="h-2 w-8 md:w-10 rounded-[5px] opacity-30" />
              </div>
              <SkeletonBar className="h-2.5 md:h-3 w-full rounded-[5px]" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="grid gap-3 grid-cols-2 md:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-[5px] bg-white border border-slate-100 p-4 md:p-8 shadow-sm flex items-center justify-between">
                <div className="space-y-2 md:space-y-4 flex-1">
                  <SkeletonBar className="h-2 w-16 md:h-2.5 md:w-24 rounded-[5px] opacity-60" />
                  <SkeletonBar className="h-7 w-14 md:h-10 md:w-20 rounded-[5px]" />
                  <SkeletonBar className="h-3 w-10 md:h-4 md:w-12 rounded-[5px] opacity-30" />
                </div>
                <SkeletonCircle size={36} />
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-[5px] bg-white border border-slate-100 p-6 shadow-sm min-h-[190px]">
                <div className="flex items-center gap-4">
                  <SkeletonCircle size={48} />
                  <SkeletonBar className="h-4 w-28 rounded-[5px]" />
                </div>
                <SkeletonBar className="h-10 w-28 rounded-[5px] mt-6" />
                <SkeletonBar className="h-2 w-full rounded-[5px] mt-4 opacity-30" />
                <SkeletonBar className="h-3 w-2/3 rounded-[5px] mt-4 opacity-50" />
              </div>
            ))}
            <div className="rounded-[5px] bg-white border border-slate-100 p-6 shadow-sm min-h-[170px]">
              <div className="flex items-center gap-4">
                <SkeletonCircle size={48} />
                <div className="space-y-2">
                  <SkeletonBar className="h-4 w-32 rounded-[5px]" />
                  <SkeletonBar className="h-3 w-16 rounded-[5px] opacity-50" />
                </div>
              </div>
              <div className="mt-6 flex items-end justify-between">
                <SkeletonBar className="h-10 w-24 rounded-[5px]" />
                <SkeletonBar className="h-5 w-16 rounded-[5px] opacity-60" />
              </div>
            </div>
            <div className="rounded-[5px] bg-white border border-slate-100 p-6 shadow-sm min-h-[170px] lg:col-span-2">
              <div className="flex items-center gap-4">
                <SkeletonCircle size={48} />
                <SkeletonBar className="h-4 w-36 rounded-[5px]" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <SkeletonBar className="h-10 w-20 rounded-[5px]" />
                  <SkeletonBar className="h-3 w-24 rounded-[5px] opacity-50" />
                </div>
                <div className="space-y-3">
                  <SkeletonBar className="h-10 w-20 rounded-[5px]" />
                  <SkeletonBar className="h-3 w-24 rounded-[5px] opacity-50" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[5px] bg-white border border-slate-100 p-4 md:p-8 shadow-sm flex flex-col min-h-[250px] md:min-h-[400px]">
            <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-6 md:mb-10">
              <div className="space-y-2 md:space-y-3">
                <SkeletonBar className="h-3.5 w-28 md:h-4 md:w-32 rounded-[5px]" />
                <SkeletonBar className="h-2 w-40 md:h-2.5 md:w-48 rounded-[5px] opacity-60" />
              </div>
              <SkeletonBar className="h-9 w-40 md:h-10 md:w-48 rounded-[5px]" />
            </div>
            <div className="flex-1 w-full bg-slate-50/50 rounded-[5px] border border-slate-50" />
          </div>
        </div>

        <div className="space-y-6 md:space-y-8 lg:sticky lg:top-6 self-start">
          <div className="rounded-[5px] border border-slate-100 bg-slate-50 p-5 md:p-8 shadow-sm h-fit">
            <div className="flex items-center gap-4 md:gap-6 mb-5 md:mb-8">
              <SkeletonCircle size={52} />
              <div className="space-y-2 md:space-y-3 flex-1">
                <SkeletonBar className="h-4 md:h-5 w-3/4 rounded-[5px]" />
                <SkeletonBar className="h-2.5 md:h-3 w-1/2 rounded-[5px] opacity-60" />
              </div>
            </div>
            <div className="space-y-3 md:space-y-4 mb-6 md:mb-10">
              <SkeletonBar className="h-10 md:h-12 w-full rounded-[5px] opacity-10" />
              <SkeletonBar className="h-10 md:h-12 w-full rounded-[5px] opacity-10" />
            </div>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <SkeletonBar className="h-9 md:h-10 rounded-[5px]" />
              <SkeletonBar className="h-9 md:h-10 rounded-[5px]" />
            </div>
          </div>
          <div className="rounded-[5px] bg-white border border-slate-100 p-5 md:p-8 shadow-sm h-fit">
             <div className="flex justify-between mb-5 md:mb-8">
               <SkeletonCircle size={28} />
               <SkeletonBar className="h-5 md:h-6 w-20 md:w-24 rounded-[5px] opacity-40" />
             </div>
             <SkeletonBar className="h-2 w-14 md:w-16 rounded-[5px] opacity-30 mb-2 md:mb-3" />
             <SkeletonBar className="h-10 md:h-12 w-28 md:w-32 rounded-[5px] opacity-50 mb-6 md:mb-10" />
             <SkeletonBar className="h-12 md:h-14 w-full rounded-[5px] opacity-35" />
          </div>
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between px-2">
          <SkeletonBar className="h-2.5 md:h-3 w-28 md:w-32 rounded-[5px]" />
          <SkeletonBar className="h-2.5 md:h-3 w-14 md:w-16 rounded-[5px] opacity-60" />
        </div>
        <div className="space-y-2 md:space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 md:gap-4 p-3 md:p-4 rounded-[5px] border border-slate-100 bg-white">
              <SkeletonCircle size={8} />
              <div className="space-y-1.5 md:space-y-2 flex-1">
                <SkeletonBar className="h-2.5 md:h-3 w-full rounded-[5px]" />
                <SkeletonBar className="h-2 w-1/2 rounded-[5px] opacity-60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Contacts list skeleton ─────────────────────────────────────────── */


