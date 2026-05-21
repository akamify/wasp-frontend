import { Search, X } from "lucide-react";
import type { RefObject } from "react";
import type { EmojiItem } from "@modules/conversations/hooks/useEmojiDataset";

type Props = {
  panelRef: RefObject<HTMLDivElement | null>;
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  items: EmojiItem[];
  onEmojiClick: (emoji: string) => void;
  onClose: () => void;
  disabled?: boolean;
};

export function EmojiPopover({ panelRef, search, onSearchChange, loading, items, onEmojiClick, onClose, disabled }: Props) {
  if (disabled) return null;

  return (
    <div
      ref={panelRef}
      className="absolute bottom-[58px] left-2 right-2 z-30 rounded-lg bg-white p-2 shadow-xl border border-slate-200 animate-in slide-in-from-bottom-2 fade-in duration-200"
      style={{ maxHeight: "280px" }}
    >
      <div className="flex items-center gap-2 px-1 pb-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search (heart, fire, party...)"
            className="w-full rounded-[10px] border border-slate-200 bg-white py-2 pl-8 pr-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600"
          />
        </div>
        <button
          type="button"
          className="rounded-[10px] p-2 text-slate-500 hover:bg-slate-100"
          onClick={onClose}
          title="Close"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1 overflow-y-auto pr-1" style={{ maxHeight: "220px" }}>
        {loading ? (
          <div className="px-2 py-3 text-xs font-semibold text-slate-500">Loading emojis...</div>
        ) : items.length ? (
          items.map((e) => (
            <button
              key={e.char}
              type="button"
              className="cursor-pointer rounded-md hover:bg-slate-100 p-1.5 text-xl transition-colors"
              onClick={() => onEmojiClick(e.char)}
              title={e.name || e.char}
            >
              {e.char}
            </button>
          ))
        ) : (
          <div className="px-2 py-3 text-xs font-semibold text-slate-500">No results</div>
        )}
      </div>
    </div>
  );
}
