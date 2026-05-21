import { Search } from "lucide-react";
import { ConversationListSkeleton } from "@components/ui/Skeletons";
import { ConversationRow } from "@modules/conversations/components/ConversationRow";
import type { Conversation } from "@modules/conversations/types/conversations.types";
import { cn } from "@shared/utils/cn";

type Filter = "all" | "unread" | "read";

type Props = {
  activePhone: string;
  search: string;
  filter: Filter;
  loading: boolean;
  conversations: Conversation[];
  onSearchChange: (value: string) => void;
  onFilterChange: (value: Filter) => void;
  onSelect: (phone: string) => void;
};

export function ConversationsSidebar({ activePhone, search, filter, loading, conversations, onSearchChange, onFilterChange, onSelect }: Props) {
  return (
    <div className={cn("w-full md:w-[350px] bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-0", activePhone ? "hidden md:flex" : "flex")}>
      <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex flex-col gap-4">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-50 border border-ink-900/5 rounded-[5px]">
            {(["all", "unread", "read"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onFilterChange(value)}
                className={`rounded-[3px] px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                  filter === value ? "bg-white text-ink-900 shadow-sm shadow-ink-900/10 ring-1 ring-ink-900/5" : "text-ink-800/40 hover:text-ink-900"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <ConversationListSkeleton rows={12} />
        ) : (
          conversations.map((item) => <ConversationRow key={item.phone} item={item} activePhone={activePhone} onSelect={onSelect} />)
        )}
      </div>
    </div>
  );
}

