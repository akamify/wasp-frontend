import { Search, ChevronLeft, ChevronRight, RefreshCw, Plus } from "lucide-react";
import { Button } from "@components/ui/Button";
import { cn } from "@shared/utils/cn";

type Props = {
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  syncing: boolean;
  onSyncMeta: () => Promise<void>;
  onOpenAdd: () => void;
  total: number;
  pageStart: number;
  pageEnd: number;
  safePage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function TemplatesListToolbar(props: Props) {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    syncing,
    onSyncMeta,
    onOpenAdd,
    total,
    pageStart,
    pageEnd,
    safePage,
    totalPages,
    onPrevPage,
    onNextPage,
  } = props;

  return (
    <div className="border-b border-slate-100 py-2">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative group w-full lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-[5px] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-600/10 focus:border-brand-500 transition-all"
            />
          </div>
          <div className="flex w-full items-center gap-1 overflow-x-auto rounded-[5px] border border-ink-900/5 bg-slate-50 p-1 lg:w-auto">
            {["all", "approved", "pending", "rejected"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`shrink-0 rounded-[3px] px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                  statusFilter === f
                    ? "bg-white text-ink-900 shadow-sm shadow-ink-900/10 ring-1 ring-ink-900/5"
                    : "text-ink-800/40 hover:text-ink-900"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => void onSyncMeta()}
            disabled={syncing}
            className="h-11 flex-1 rounded-[5px] bg-slate-900 px-5 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-all hover:bg-black sm:flex-none"
          >
            <RefreshCw size={16} className={cn("mr-2", syncing && "animate-spin")} />
            Sync
          </Button>
          <Button
            onClick={onOpenAdd}
            className="h-11 flex-1 rounded-[5px] bg-brand-600 px-5 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-all hover:bg-brand-700 sm:flex-none"
          >
            <Plus size={16} className="mr-2" /> New
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 py-4">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Showing <span className="text-slate-900">{total > 0 ? pageStart + 1 : 0} - {pageEnd}</span> of {total}
        </p>
        <div className="flex items-center gap-3">
          <button
            disabled={safePage <= 1}
            onClick={onPrevPage}
            className="p-2 bg-slate-50 border border-slate-100 rounded-[5px] text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-black text-slate-900">{safePage} / {totalPages}</span>
          <button
            disabled={safePage >= totalPages}
            onClick={onNextPage}
            className="p-2 bg-slate-50 border border-slate-100 rounded-[5px] text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
