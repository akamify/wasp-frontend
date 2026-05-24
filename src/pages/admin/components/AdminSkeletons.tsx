import React from "react";
import { cn } from "@shared/utils/cn";

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {/* Toolbar */}
      <div className="rounded-[5px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
          <div className="h-4 w-40 bg-slate-100 rounded-[5px]" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-56 bg-slate-100 rounded-[5px]" />
            <div className="h-9 w-24 bg-slate-100 rounded-[5px]" />
            <div className="h-9 w-24 bg-slate-100 rounded-[5px]" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[5px] border border-slate-200 bg-white shadow-sm">
        {/* Header row */}
        <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 border-b border-slate-100">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className={cn(
                "h-3 bg-slate-200/70 rounded-[5px]",
                j === 0 ? "w-1/4" : j === cols - 1 ? "w-24" : "flex-1"
              )}
            />
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center px-6 py-4 gap-4">
              {Array.from({ length: cols }).map((_, j) => (
                <div
                  key={j}
                  className={cn(
                    "h-4 bg-slate-100 rounded-[5px]",
                    j === 0 ? "w-1/4" : j === cols - 1 ? "w-24" : "flex-1",
                    i % 3 === 0 && j === 1 ? "max-w-[240px]" : ""
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="p-4 pb-20 md:p-8 space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-10 w-72 bg-white border border-slate-200 rounded-[5px] shadow-sm" />
        <div className="h-5 w-96 max-w-full bg-white border border-slate-200 rounded-[5px] shadow-sm" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 bg-white border border-slate-200 rounded-[5px] shadow-sm p-6">
            <div className="h-3 w-24 bg-slate-100 rounded-[5px]" />
            <div className="mt-4 h-10 w-20 bg-slate-100 rounded-[5px]" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[5px] shadow-sm p-8 space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-[5px] border border-slate-100 p-6 space-y-3">
                <div className="h-8 w-8 bg-slate-100 rounded-[5px]" />
                <div className="h-3 w-20 bg-slate-100 rounded-[5px]" />
                <div className="h-8 w-16 bg-slate-100 rounded-[5px]" />
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="h-6 w-44 bg-slate-100 rounded-[5px]" />
                <div className="h-4 w-56 bg-slate-100 rounded-[5px]" />
              </div>
              <div className="h-9 w-52 bg-slate-100 rounded-[5px]" />
            </div>
            <div className="h-3 w-44 bg-slate-100 rounded-[5px]" />
            <div className="h-[220px] w-full bg-slate-100 rounded-[5px]" />
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-3 bg-slate-100 rounded-[5px]" />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[5px] shadow-sm p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="h-6 w-40 bg-slate-100 rounded-[5px]" />
            <div className="h-5 w-14 bg-slate-100 rounded-[5px]" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-[5px] border border-slate-100 p-3 space-y-2">
                <div className="h-3 w-40 bg-slate-100 rounded-[5px]" />
                <div className="h-3 w-32 bg-slate-100 rounded-[5px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
