import React, { useState, useEffect } from "react";
import { Button } from "@components/ui/Button";
import { RefreshCw, Search, Filter, SlidersHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@shared/utils/cn";
import { useToast } from "@shared/providers/ToastContext";

export function AdminToolbar({
  title,
  subtitle,
  query,
  setQuery,
  onRefresh,
  right,
  isSyncing = false,
  filterOptions,
  currentFilter,
  onFilterChange,
  sortOptions,
  currentSort,
  onSortChange,
}: {
  title: string;
  subtitle?: string;
  query?: string;
  setQuery?: (v: string) => void;
  onRefresh?: () => void | Promise<void>;
  right?: React.ReactNode;
  isSyncing?: boolean;
  filterOptions?: { label: string; value: string }[];
  currentFilter?: string;
  onFilterChange?: (v: string) => void;
  sortOptions?: { label: string; value: string }[];
  currentSort?: string;
  onSortChange?: (v: string) => void;
}) {
  const { toast } = useToast();
  const [localSyncing, setLocalSyncing] = useState(false);
  const [localQuery, setLocalQuery] = useState(query || "");

  useEffect(() => {
    setLocalQuery(query || "");
  }, [query]);

  const handleRefresh = async () => {
    if (!onRefresh || localSyncing || isSyncing) return;
    setLocalSyncing(true);
    try {
      await onRefresh();
      // Since list.refresh is usually synchronous state update, we wait a bit or assume it's working
      toast("Sync triggered successfully", "success");
    } catch (e: any) {
      toast(e?.message || "Refresh failed", "error");
    } finally {
      // Keep it spinning for at least 600ms for visual feedback
      setTimeout(() => setLocalSyncing(false), 600);
    }
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery?.(localQuery);
  };

  const activeSyncing = isSyncing || localSyncing;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-none">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-slate-500 font-medium">{subtitle}</p> : null}
        </div>
        
        <div className="flex items-center gap-3">
          {onRefresh ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleRefresh}
              disabled={activeSyncing}
              className="rounded-[5px] h-10 px-4 border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-600 gap-2 shadow-sm transition-all active:scale-95"
            >
              <RefreshCw size={14} className={cn(activeSyncing && "animate-spin")} />
              {activeSyncing ? "Syncing..." : "Refresh"}
            </Button>
          ) : null}
          {right}
        </div>
      </div>

      <div className="rounded-[5px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            {typeof query === "string" && typeof setQuery === "function" ? (
              <form onSubmit={onSearchSubmit} className="flex-1 flex items-center gap-2">
                <div className="relative group flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-white border border-slate-200 rounded-[5px] text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
                  />
                </div>
                <Button type="submit" className="h-12 px-6 rounded-[5px] font-black uppercase tracking-widest text-[10px]">
                  Search
                </Button>
              </form>
            ) : null}
            
            {(filterOptions || sortOptions) && (
              <div className="flex flex-wrap items-center gap-4">
                {filterOptions && (
                  <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-[5px] shadow-sm">
                    {filterOptions.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => onFilterChange?.(f.value)}
                        className={cn(
                          "rounded-[3px] px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                          currentFilter === f.value
                            ? "bg-slate-900 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}

                {sortOptions && (
                  <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-[5px] shadow-sm">
                    {sortOptions.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => onSortChange?.(s.value)}
                        className={cn(
                          "rounded-[3px] px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                          currentSort === s.value
                            ? "bg-brand-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
