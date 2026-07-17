import { useEffect, useState } from "react";
import { Modal } from "@components/ui/Modal";
import { API } from "@api/api";
import { Search } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (item: any) => void;
};

export function AcademySearchModal({ open, onClose, onPick }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    let active = true;
    setLoading(true);
    const timer = window.setTimeout(() => {
      API.public
        .academySearch({ q: trimmed, limit: 10 })
        .then((response: any) => {
          if (!active) return;
          setResults(Array.isArray(response?.results) ? response.results : []);
        })
        .catch(() => {
          if (!active) return;
          setResults([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  return (
    <Modal isOpen={open} onClose={onClose} title="Search Academy" className="max-w-3xl">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, category, tags, or keywords..."
            className="h-12 w-full rounded-[5px] border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none ring-brand-500/20 transition focus:ring-2"
          />
        </div>

        <div className="rounded-[5px] border border-slate-100 bg-slate-50/80">
          {loading ? (
            <div className="px-4 py-8 text-sm font-medium text-slate-500">Searching...</div>
          ) : results.length ? (
            <div className="divide-y divide-slate-100">
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPick(item)}
                  className="block w-full px-4 py-4 text-left transition hover:bg-white"
                >
                  <div className="text-xs font-black uppercase tracking-[0.24em] text-brand-600">{item?.category?.name || "Academy"}</div>
                  <div className="mt-1 text-base font-black text-slate-950">{item?.title}</div>
                  <div className="mt-1 text-sm leading-6 text-slate-600">{item?.description || "Open article"}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-sm font-medium text-slate-500">
              {query.trim() ? "No matching articles found." : "Type to search AI Wiz Chat Academy."}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
