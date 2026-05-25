import { SkeletonBar, SkeletonCircle } from "./primitives";
export function MetaConnectionSkeleton() {
  return (
    <div className="grid gap-8 p-3 md:p-8">
      <SkeletonBar className="h-4 w-64 rounded-[5px]" />
      <div className="rounded-[5px] border border-slate-100 bg-slate-50 p-8">
        <SkeletonBar className="h-3 w-full rounded-[5px] mb-4" />
        <SkeletonBar className="h-3 w-2/3 rounded-[5px] opacity-60" />
      </div>
      <div className="space-y-4">
        <SkeletonBar className="h-3 w-1/3 rounded-[5px]" />
        <SkeletonBar className="h-3 w-1/2 rounded-[5px] opacity-60" />
        <SkeletonBar className="h-3 w-1/3 rounded-[5px]" />
      </div>
    </div>
  );
}

/* ─── Generic page component skeletons ──────────────────────────────── */

export function FlowsSkeleton() {
  return (
    <div className="grid gap-8 animate-pulse">
      <div className="rounded-[5px] border border-slate-100 bg-white p-10 shadow-sm">
        <SkeletonBar className="h-3 w-24 rounded-[5px] mb-5" />
        <SkeletonBar className="h-12 w-80 rounded-[5px] mb-5" />
        <SkeletonBar className="h-3 w-64 rounded-[5px] opacity-60" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[440px_1fr]">
        <div className="rounded-[5px] bg-white p-10 border border-slate-100 shadow-sm">
          <SkeletonBar className="h-6 w-1/3 mb-10 rounded-[5px]" />
          <div className="space-y-6">
            <SkeletonBar className="h-16 rounded-[5px]" />
            <SkeletonBar className="h-16 rounded-[5px]" />
            <SkeletonBar className="h-32 rounded-[5px]" />
            <SkeletonBar className="h-14 w-40 rounded-[5px] mt-6" />
          </div>
        </div>
        <div className="rounded-[5px] bg-white p-10 border border-slate-100 shadow-sm">
          <SkeletonBar className="h-6 w-1/4 mb-10 rounded-[5px]" />
          <div className="space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBar key={i} className="h-20 w-full rounded-[5px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WalletSkeleton() {
  return (
    <div className="grid gap-6 p-4 md:p-8 animate-pulse">
      <div className="rounded-[5px] bg-white p-8 border border-slate-100 shadow-sm">
        <SkeletonBar className="h-3 w-24 rounded-[5px] mb-5" />
        <SkeletonBar className="h-12 w-56 rounded-[5px] mb-5" />
        <SkeletonBar className="h-3 w-96 rounded-[5px] opacity-60" />
      </div>
      <div className="rounded-[5px] bg-white p-8 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-8 mb-12">
          <div>
            <SkeletonBar className="h-3 w-20 mb-4 rounded-[5px]" />
            <SkeletonBar className="h-12 w-48 rounded-[5px]" />
          </div>
          <div className="flex gap-4">
            <SkeletonBar className="h-14 w-32 rounded-[5px]" />
            <SkeletonBar className="h-14 w-40 rounded-[5px]" />
          </div>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBar key={i} className="h-20 w-full rounded-[5px]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8 animate-pulse">
      <div className="rounded-[5px] bg-white p-8 border border-slate-100 shadow-sm">
        <SkeletonBar className="h-3 w-20 rounded-[5px] mb-5" />
        <SkeletonBar className="h-12 w-64 rounded-[5px] mb-5" />
        <SkeletonBar className="h-3 w-96 rounded-[5px] opacity-60" />
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[5px] bg-white p-8 border border-slate-100 shadow-sm">
          <SkeletonBar className="h-6 w-1/4 mb-6 rounded-[5px]" />
          <SkeletonBar className="h-3 w-2/4 mb-10 rounded-[5px] opacity-60" />
          <div className="space-y-6">
            <SkeletonBar className="h-16 rounded-[5px]" />
            <SkeletonBar className="h-16 rounded-[5px]" />
            <SkeletonBar className="h-16 rounded-[5px]" />
          </div>
          <div className="mt-8">
            <SkeletonBar className="h-14 w-full rounded-[5px]" />
          </div>
        </div>
        <div className="space-y-8">
          <div className="rounded-[5px] bg-white p-8 border border-slate-100 shadow-sm">
            <SkeletonBar className="h-6 w-1/4 mb-6 rounded-[5px]" />
            <div className="space-y-6">
              <SkeletonBar className="h-16 w-full rounded-[5px]" />
              <SkeletonBar className="h-16 w-full rounded-[5px]" />
              <SkeletonBar className="h-16 w-full rounded-[5px]" />
            </div>
            <div className="mt-8">
              <SkeletonBar className="h-14 w-full rounded-[5px]" />
            </div>
          </div>
          <div className="rounded-[5px] bg-amber-50/50 p-6 border border-amber-100 shadow-sm">
            <SkeletonBar className="h-10 w-full rounded-[5px] opacity-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AutomationSkeleton() {
  return (
    <div className="grid gap-6 p-4 md:p-8 animate-pulse">
      <div className="rounded-[5px] bg-white p-8 border border-slate-100 shadow-sm">
        <SkeletonBar className="h-3 w-24 rounded-[5px] mb-5" />
        <SkeletonBar className="h-12 w-72 rounded-[5px] mb-5" />
        <SkeletonBar className="h-3 w-96 rounded-[5px] opacity-60" />
      </div>
      <div className="rounded-[5px] bg-white p-8 border border-slate-100 shadow-sm">
        <SkeletonBar className="h-6 w-1/4 mb-10 rounded-[5px]" />
        <div className="grid gap-6">
          <SkeletonBar className="h-16 rounded-[5px]" />
          <SkeletonBar className="h-16 rounded-[5px]" />
          <SkeletonBar className="h-16 rounded-[5px]" />
          <SkeletonBar className="h-14 w-full mt-4 rounded-[5px]" />
        </div>
      </div>
    </div>
  );
}

export function CampaignDetailSkeleton() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-[#F8FAFC] animate-pulse">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-30 w-full bg-white border-b border-ink-900/5 shadow-sm">
        <div className="px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <SkeletonBar className="h-10 w-10 rounded-[5px]" />
              <SkeletonBar className="h-8 w-48 md:w-64 rounded-[5px]" />
            </div>
            <SkeletonBar className="h-10 w-24 rounded-[5px]" />
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBar key={i} className="h-12 w-28 rounded-[5px] opacity-40" />
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-6 md:gap-8 lg:grid-cols-[360px_minmax(0,1fr)] items-start w-full">
          {/* Left Side */}
          <div className="space-y-6 flex flex-col items-center">
            <div className="rounded-[5px] bg-white border border-slate-100 p-6 shadow-sm w-full space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <SkeletonBar className="h-2 w-20 opacity-30" />
                    <SkeletonBar className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[5px] bg-white border border-slate-100 p-8 shadow-sm w-full min-h-[400px] flex items-center justify-center">
              <div className="w-full max-w-[280px] space-y-4">
                <SkeletonBar className="h-48 w-full rounded-[5px] opacity-20" />
                <SkeletonBar className="h-4 w-full" />
                <SkeletonBar className="h-4 w-2/3 opacity-60" />
                <SkeletonBar className="h-10 w-full mt-6 rounded-[5px]" />
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-6">
            <div className="rounded-[5px] bg-white border border-slate-100 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <SkeletonBar className="h-6 w-32" />
                <SkeletonBar className="h-10 w-10 rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-4 md:gap-8 mb-10">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <SkeletonBar className="h-3 w-16 opacity-30" />
                    <SkeletonBar className="h-6 w-12" />
                  </div>
                ))}
              </div>
              <div className="pt-8 border-t border-slate-50">
                <SkeletonBar className="h-36 w-full rounded-[5px] opacity-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ApiKeysSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-1">
      <div className="rounded-[5px] bg-slate-50 p-10 border border-slate-100 shadow-sm h-fit">
        <div className="flex justify-between items-center mb-10">
           <div className="space-y-3">
              <SkeletonBar className="h-6 w-48 rounded-[5px]" />
              <SkeletonBar className="h-3 w-32 rounded-[5px] opacity-60" />
           </div>
           <SkeletonCircle size={48} />
        </div>
        <SkeletonBar className="h-4 w-full rounded-[5px] mb-8 opacity-60" />
        <SkeletonBar className="h-16 w-full rounded-[5px] mb-10 opacity-30" />
        <SkeletonBar className="h-14 w-full rounded-[5px]" />
      </div>
      <div className="rounded-[5px] bg-slate-50 p-10 border border-slate-100 shadow-sm h-fit">
        <div className="flex justify-between items-center mb-10">
           <div className="space-y-3">
              <SkeletonBar className="h-6 w-48 rounded-[5px]" />
              <SkeletonBar className="h-3 w-32 rounded-[5px] opacity-60" />
           </div>
           <SkeletonCircle size={48} />
        </div>
        <SkeletonBar className="h-4 w-full rounded-[5px] mb-10 opacity-60" />
        <SkeletonBar className="h-16 w-full rounded-[5px] mb-10" />
        <div className="rounded-[5px] bg-slate-50 p-6 border border-slate-100">
           <SkeletonBar className="h-2.5 w-32 rounded-[5px] mb-4" />
           <SkeletonBar className="h-4 w-full rounded-[5px] opacity-60" />
        </div>
      </div>
    </div>
  );
}


