import React from "react";
import { cn } from "@shared/utils/cn";

export function AdminTable({
  columns,
  children,
}: {
  columns: Array<{ key: string; label: string; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[5px] border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/80">
              {columns.map((c, i) => (
                <th 
                  key={c.key} 
                  className={cn(
                    "px-6 py-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 border-b border-slate-100", 
                    i === 0 && "pl-8",
                    c.className
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

