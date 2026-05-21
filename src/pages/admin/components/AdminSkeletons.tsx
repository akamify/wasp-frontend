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
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
      <div className="h-32 bg-white border border-slate-200 rounded-[5px] shadow-sm" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white border border-slate-200 rounded-[5px] shadow-sm" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-96 bg-white border border-slate-200 rounded-[5px] shadow-sm" />
        <div className="h-96 bg-white border border-slate-200 rounded-[5px] shadow-sm" />
      </div>
    </div>
  );
}
