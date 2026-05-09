/* ─── Skeleton primitives ──────────────────────────────────────────────── */

import { cn } from "../../utils/cn";

/** Single shimmer bar. className controls width / height / border-radius. */
export function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`skeleton-bar ${className}`} />;
}

/** Rounded avatar / circle block. */
export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return (
    <div
      className="skeleton-bar flex-shrink-0"
      style={{ width: size, height: size, borderRadius: "5px" }}
    />
  );
}

/* ─── Auth / session fullscreen skeleton ─────────────────────────────── */
export function SessionSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
      <div className="skeleton-bar h-10 w-10 rounded-[5px]" />
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <SkeletonBar className="h-3 w-40 rounded-[5px]" />
        <SkeletonBar className="h-2.5 w-28 rounded-[5px]" />
      </div>
    </div>
  );
}

/* ─── Dashboard full-page skeleton ──────────────────────────────────── */
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
            {Array.from({ length: 4 }).map((_, i) => (
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

        <div className="space-y-6 md:space-y-8">
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
          <div className="rounded-[5px] bg-slate-900 p-5 md:p-8 shadow-sm h-fit">
             <div className="flex justify-between mb-5 md:mb-8">
               <SkeletonCircle size={28} />
               <SkeletonBar className="h-5 md:h-6 w-20 md:w-24 rounded-[5px] opacity-20" />
             </div>
             <SkeletonBar className="h-2 w-14 md:w-16 rounded-[5px] opacity-20 mb-2 md:mb-3" />
             <SkeletonBar className="h-10 md:h-12 w-28 md:w-32 rounded-[5px] opacity-40 mb-6 md:mb-10" />
             <SkeletonBar className="h-12 md:h-14 w-full rounded-[5px] opacity-20" />
          </div>
          <div className="space-y-3 md:space-y-4">
             <SkeletonBar className="h-2.5 md:h-3 w-28 md:w-32 rounded-[5px] mx-2" />
             <div className="space-y-2 md:space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 md:gap-4 p-3 md:p-4">
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
      </div>
    </div>
  );
}

/* ─── Contacts list skeleton ─────────────────────────────────────────── */
export function ContactsListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 md:space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-[5px] border border-ink-900/8 bg-slate-50/50 p-3 md:p-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4">
            <div className="space-y-2 md:space-y-3 flex-1">
              <SkeletonBar className="h-4 md:h-5 w-32 md:w-40 rounded-[5px]" />
              <SkeletonBar className="h-2 w-48 md:h-2.5 md:w-64 rounded-[5px] opacity-60" />
              <SkeletonBar className="h-3 md:h-3.5 w-1/2 rounded-[5px] opacity-40 mt-2 md:mt-3" />
            </div>
            <div className="flex items-center gap-2">
              <SkeletonBar className="h-6 w-14 md:h-6 md:w-16 rounded-[5px]" />
              <SkeletonBar className="h-8 md:h-9 w-28 md:w-32 rounded-[5px]" />
            </div>
          </div>
          <div className="mt-4 md:mt-6 grid grid-cols-3 gap-2 md:gap-4 pt-3 md:pt-4 border-t border-black/5">
            <SkeletonBar className="h-2 w-full rounded-[5px] opacity-30" />
            <SkeletonBar className="h-2 w-full rounded-[5px] opacity-30" />
            <SkeletonBar className="h-2 w-full rounded-[5px] opacity-30" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Conversations sidebar (chat list) skeleton ─────────────────────── */
export function ConversationListSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 md:gap-5 border-b border-slate-50 px-4 md:px-6 py-4 md:py-5">
          <SkeletonBar className="h-12 w-12 md:h-14 md:w-14 rounded-[5px] shrink-0" />
          <div className="min-w-0 flex-1 flex flex-col gap-2 md:gap-3">
            <SkeletonBar className="h-3.5 md:h-4 w-1/2 rounded-[5px]" />
            <SkeletonBar className="h-2 md:h-2.5 w-3/4 rounded-[5px] opacity-60" />
          </div>
          <div className="flex flex-col items-end gap-2 md:gap-3">
            <SkeletonBar className="h-2 md:h-2.5 w-10 md:w-12 rounded-[5px]" />
            <SkeletonBar className="h-5 w-5 md:h-6 md:w-6 rounded-[5px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Chat messages skeleton ─────────────────────────────────────────── */
export function ChatMessagesSkeleton({ count = 6 }: { count?: number }) {
  const widths = ["w-2/3", "w-3/4", "w-1/2", "w-4/5", "w-3/5", "w-2/3"];
  return (
    <div className="space-y-6 p-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`max-w-[70%] rounded-[5px] p-6 shadow-sm ${i % 2 === 0 ? "ml-auto bg-white" : "mr-auto bg-slate-100"}`}>
          <div className="flex flex-col gap-3">
            <SkeletonBar className={`h-4 ${widths[i % widths.length]} rounded-[5px]`} />
            <SkeletonBar className="h-2.5 w-1/4 rounded-[5px] opacity-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Templates table skeleton (desktop) ────────────────────────────── */
export function TemplatesTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-slate-50">
          <td className="px-8 py-6">
            <div className="flex items-center gap-4">
              <SkeletonBar className="h-6 w-6 rounded-[5px] shrink-0" />
              <SkeletonBar className="h-4 w-64 rounded-[5px]" />
            </div>
          </td>
          <td className="px-8 py-6">
            <SkeletonBar className="h-8 w-32 rounded-[5px]" />
          </td>
          <td className="px-8 py-6">
            <SkeletonBar className="h-8 w-24 rounded-[5px]" />
          </td>
          <td className="px-8 py-6 text-right">
            <div className="flex items-center justify-end gap-3">
              <SkeletonBar className="h-12 w-20 rounded-[5px]" />
              <SkeletonBar className="h-12 w-20 rounded-[5px]" />
              <SkeletonBar className="h-12 w-24 rounded-[5px]" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/* ─── Templates card skeleton (mobile) ──────────────────────────────── */
export function TemplatesCardSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[5px] border border-slate-100 bg-white p-8 shadow-sm animate-pulse">
          <div className="mb-6 flex items-center gap-4">
            <SkeletonBar className="h-6 w-6 rounded-[5px] shrink-0" />
            <SkeletonBar className="h-4 w-2/3 rounded-[5px]" />
          </div>
          <div className="mb-8 flex gap-3">
            <SkeletonBar className="h-8 w-32 rounded-[5px]" />
            <SkeletonBar className="h-8 w-24 rounded-[5px]" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <SkeletonBar className="h-12 rounded-[5px]" />
            <SkeletonBar className="h-12 rounded-[5px]" />
            <SkeletonBar className="h-12 rounded-[5px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Meta connection skeleton ──────────────────────────────────────── */
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

export function CampaignsListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-slate-50">
          <td className="px-6 py-6">
            <div className="space-y-2">
              <SkeletonBar className="h-4 w-40 rounded-[5px]" />
              <SkeletonBar className="h-2.5 w-24 rounded-[5px] opacity-60" />
            </div>
          </td>
          <td className="px-6 py-6"><SkeletonBar className="h-4 w-16 rounded-[5px]" /></td>
          <td className="px-6 py-6"><SkeletonBar className="h-4 w-28 rounded-[5px]" /></td>
          <td className="px-6 py-6"><SkeletonBar className="h-8 w-24 rounded-[5px]" /></td>
          <td className="px-6 py-6"><SkeletonBar className="h-4 w-10 rounded-[5px]" /></td>
          <td className="px-6 py-6"><SkeletonBar className="h-4 w-10 rounded-[5px]" /></td>
          <td className="px-6 py-6 text-right pr-10">
            <div className="flex justify-end"><SkeletonBar className="h-8 w-8 rounded-[5px]" /></div>
          </td>
        </tr>
      ))}
    </>
  );
}

export function ActivityListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 md:space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white p-3 md:p-5 rounded-[5px] border border-slate-100 shadow-sm flex items-center gap-3 md:gap-4">
          <SkeletonBar className="h-10 w-10 md:h-12 md:w-12 rounded-[5px]" />
          <div className="flex-1 space-y-2 md:space-y-3">
            <SkeletonBar className="h-3.5 md:h-4 w-1/4 rounded-[5px]" />
            <SkeletonBar className="h-2 md:h-2.5 w-1/2 rounded-[5px] opacity-60" />
          </div>
          <div className="flex flex-col items-end gap-1.5 md:gap-2">
            <SkeletonBar className="h-5 md:h-6 w-16 md:w-20 rounded-[5px]" />
            <SkeletonBar className="h-2 md:h-2.5 w-10 md:w-12 rounded-[5px] opacity-60" />
          </div>
        </div>
      ))}
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
