import { SkeletonBar } from "./primitives";
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
          <td className="px-6 py-6 text-center"><SkeletonBar className="h-4 w-16 rounded-[5px] mx-auto" /></td>
          <td className="px-6 py-6 text-center"><SkeletonBar className="h-4 w-20 rounded-[5px] mx-auto" /></td>
          <td className="px-6 py-6"><SkeletonBar className="h-5 w-20 rounded-[5px]" /></td>
          <td className="px-6 py-6"><SkeletonBar className="h-4 w-24 rounded-[5px]" /></td>
          <td className="px-6 py-6 text-right">
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


