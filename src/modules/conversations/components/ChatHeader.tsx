import { ArrowLeft, Edit3, EllipsisVertical, Info, Phone, Trash2, Video } from "lucide-react";
import type { RefObject } from "react";
import type { Conversation } from "@modules/conversations/types/conversations.types";
import { cn } from "@shared/utils/cn";

type Props = {
  activeConversation: Conversation | null;
  contactDetail: any | null;
  customerServiceWindowOpen: boolean;
  headerMenuRef: RefObject<HTMLDivElement | null>;
  menuOpen: boolean;
  phone: string;
  waLink: string;
  onBack: () => void;
  onClearChat: () => void;
  onEdit: () => void;
  onMenuToggle: () => void;
  onShowProfile: () => void;
};

export function ChatHeader({
  activeConversation,
  contactDetail,
  customerServiceWindowOpen,
  headerMenuRef,
  menuOpen,
  phone,
  waLink,
  onBack,
  onClearChat,
  onEdit,
  onMenuToggle,
  onShowProfile,
}: Props) {
  return (
    <div className="h-16 flex items-center justify-between px-3 md:px-6 bg-white border-b border-slate-100 shrink-0 z-10">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="md:hidden -ml-2 p-2.5 hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-[5px] transition-all" aria-label="Back to conversations">
          <ArrowLeft size={20} />
        </button>
        <div className="hidden md:block h-10 w-10 rounded-[8px] bg-slate-100 overflow-hidden shadow-sm">
          <img src={`https://ui-avatars.com/api/?name=${activeConversation?.contact?.name || phone}&background=random`} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <button type="button" className="font-black text-sm text-slate-900 leading-none mb-1 truncate hover:text-brand-600 transition-colors" onClick={() => { if (waLink) window.open(waLink, "_blank", "noopener,noreferrer"); }} title="Open in WhatsApp">
            {contactDetail?.name || activeConversation?.contact?.name || `+${phone}`}
          </button>
          <div className="flex items-center gap-1.5">
            <div className={cn("h-2 w-2 rounded-full animate-pulse", customerServiceWindowOpen ? "bg-emerald-500" : "bg-rose-500")} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {customerServiceWindowOpen ? "Window open" : "Window closed"}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2.5 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[5px] transition-all"><Video size={20} /></button>
        <button className="p-2.5 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[5px] transition-all"><Phone size={18} /></button>
        <div className="w-px h-6 bg-slate-100 mx-1" />
        <div ref={headerMenuRef} className="relative">
          <button type="button" onClick={onMenuToggle} className={cn("inline-flex p-2.5 rounded-[5px] transition-all", menuOpen ? "bg-brand-50 text-brand-600" : "hover:bg-slate-50 text-slate-400 hover:text-slate-900")} aria-label="Info">
            <EllipsisVertical size={20} />
          </button>
          {menuOpen ? (
            <>
              <HeaderMenu mobile onEdit={onEdit} onClearChat={onClearChat} onShowProfile={onShowProfile} />
              <HeaderMenu onEdit={onEdit} onClearChat={onClearChat} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HeaderMenu({ mobile, onClearChat, onEdit, onShowProfile }: { mobile?: boolean; onClearChat: () => void; onEdit: () => void; onShowProfile?: () => void }) {
  return (
    <div className={`${mobile ? "md:hidden w-44" : "hidden md:block w-56"} absolute right-0 top-12 z-30 overflow-hidden rounded-[10px] border border-slate-100 bg-white shadow-xl`}>
      {mobile ? (
        <button type="button" onClick={onShowProfile} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
          <Info size={16} /> View profile
        </button>
      ) : null}
      <button type="button" onClick={onEdit} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
        <Edit3 size={16} /> Edit contact
      </button>
      <button type="button" onClick={onClearChat} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50">
        <Trash2 size={16} /> Clear chat
      </button>
    </div>
  );
}

