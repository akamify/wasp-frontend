import { Button } from "@components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function AdminPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safePage = Math.min(Math.max(1, page || 1), safeTotalPages);
  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[5px] border border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div className="text-sm font-medium text-slate-500">
        Total Results: <span className="font-bold text-slate-900">{total.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          disabled={safePage <= 1} 
          onClick={() => onPageChange(safePage - 1)}
          className="rounded-[5px] h-9 px-4 border-slate-200 text-slate-600 font-bold"
        >
          <ChevronLeft size={16} className="mr-1" /> Prev
        </Button>
        <div className="px-4 py-1.5 bg-slate-50 rounded-[5px] border border-slate-100 text-xs font-black text-slate-900 tracking-widest min-w-[100px] text-center">
          PAGE {safePage} OF {safeTotalPages}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          disabled={safePage >= safeTotalPages} 
          onClick={() => onPageChange(safePage + 1)}
          className="rounded-[5px] h-9 px-4 border-slate-200 text-slate-600 font-bold"
        >
          Next <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}
