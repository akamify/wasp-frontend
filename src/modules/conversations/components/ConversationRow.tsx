import { cn } from "@shared/utils/cn";
import type { Conversation } from "@modules/conversations/types/conversations.types";

type Props = {
  item: Conversation;
  activePhone: string;
  onSelect: (phone: string) => void;
};

export function ConversationRow({ item, activePhone, onSelect }: Props) {
  const isActive = activePhone === item.phone;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.phone)}
      className={cn(
        "w-full flex items-center gap-4 cursor-pointer p-4 transition-all border-b border-slate-50 relative group",
        isActive ? "bg-brand-50/50" : "hover:bg-slate-50"
      )}
    >
      <div className="h-12 w-12 rounded-[8px] bg-slate-100 shrink-0 overflow-hidden shadow-sm relative">
        <img
          src={`https://ui-avatars.com/api/?name=${item.contact?.name || item.phone}&background=random&size=128`}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="mb-0.5 flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <span className="block max-w-full truncate pr-2 text-sm font-black text-slate-900">
              {item.contact?.name || `+${item.phone}`}
            </span>
            <p
              className="block w-full max-w-full truncate text-xs font-medium leading-none text-slate-500"
              title={item.lastMessagePreview || "No messages yet"}
            >
              {item.lastMessagePreview || "No messages yet"}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="text-[10px] font-bold text-slate-400 shrink-0">
              {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
            </span>
            {Number(item.unreadCount || 0) > 0 && (
              <span className="min-w-5 h-5 px-1 bg-brand-600 text-white text-[10px] font-black rounded-[5px] flex items-center justify-center ring-2 ring-white">
                {Number(item.unreadCount || 0)}
              </span>
            )}
          </div>
        </div>
      </div>
      {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-600 rounded-l-[5px] shadow-lg shadow-brand-500/20" />}
    </button>
  );
}
