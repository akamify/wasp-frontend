import { ArrowLeft, Bot, Edit3, EllipsisVertical, Hand, Info, Phone, Trash2, Video } from "lucide-react";
import type { RefObject } from "react";
import { AI_STATES } from "@modules/conversations/constants/aiState";
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
  onAssignHuman?: () => void;
  onTakeOverAndAssign?: () => void;
  onClearChat: () => void;
  onEdit: () => void;
  onReturnToAi?: () => void;
  onTakeOver?: () => void;
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
  onAssignHuman,
  onTakeOverAndAssign,
  onClearChat,
  onEdit,
  onReturnToAi,
  onTakeOver,
  onMenuToggle,
  onShowProfile,
}: Props) {
  const aiState = activeConversation?.aiState || null;
  const stateBadge = aiState === AI_STATES.HANDOVER_PENDING
    ? { label: "Handover pending", className: "bg-amber-100 text-amber-700" }
    : aiState === AI_STATES.HUMAN_ACTIVE
      ? { label: "Human takeover", className: "bg-sky-100 text-sky-700" }
      : aiState === AI_STATES.AI_ACTIVE
        ? { label: "AI active", className: "bg-emerald-100 text-emerald-700" }
        : aiState === AI_STATES.PAUSED
          ? { label: "AI paused", className: "bg-slate-200 text-slate-700" }
        : null;
  return (
    <div className="h-16 flex min-w-0 items-center justify-between px-3 md:px-6 bg-white border-b border-slate-100 shrink-0 z-10">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button type="button" onClick={onBack} className="md:hidden -ml-2 p-2.5 hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-[5px] transition-all" aria-label="Back to conversations">
          <ArrowLeft size={20} />
        </button>
        <div className="hidden md:block h-10 w-10 shrink-0 rounded-[8px] bg-slate-100 overflow-hidden shadow-sm">
          <img src={`https://ui-avatars.com/api/?name=${activeConversation?.contact?.name || phone}&background=random`} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <button type="button" className="font-black text-sm text-slate-900 leading-none mb-1 truncate hover:text-brand-600 transition-colors" onClick={() => { if (waLink) window.open(waLink, "_blank", "noopener,noreferrer"); }} title="Open in WhatsApp">
            {contactDetail?.name || activeConversation?.contact?.name || `+${phone}`}
          </button>
          <div className="flex items-center gap-1.5">
            <div className={cn("h-2 w-2 rounded-full animate-pulse", customerServiceWindowOpen ? "bg-emerald-500" : "bg-rose-500")} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {customerServiceWindowOpen ? "Window open" : "Window closed"}
            </span>
            {stateBadge ? (
              <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider", stateBadge.className)}>
                {stateBadge.label}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {aiState === AI_STATES.AI_ACTIVE || aiState === AI_STATES.HANDOVER_PENDING ? (
          <button type="button" onClick={onTakeOver} className="hidden md:inline-flex items-center gap-1.5 rounded-[5px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-700 transition-all hover:bg-amber-100">
            <Hand size={14} /> Take Over
          </button>
        ) : null}
        {(aiState === AI_STATES.HANDOVER_PENDING || aiState === AI_STATES.HUMAN_ACTIVE) && onAssignHuman ? (
          <button type="button" onClick={onAssignHuman} className="hidden md:inline-flex items-center gap-1.5 rounded-[5px] border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-black text-sky-700 transition-all hover:bg-sky-100">
            <Hand size={14} /> Assign Human
          </button>
        ) : null}
        {(aiState === AI_STATES.AI_ACTIVE || aiState === AI_STATES.HANDOVER_PENDING) && onTakeOverAndAssign ? (
          <button type="button" onClick={onTakeOverAndAssign} className="hidden md:inline-flex items-center gap-1.5 rounded-[5px] border border-brand-200 bg-brand-50 px-3 py-2 text-[11px] font-black text-brand-700 transition-all hover:bg-brand-100">
            <Hand size={14} /> Take Over & Assign
          </button>
        ) : null}
        {aiState === AI_STATES.HUMAN_ACTIVE ? (
          <button type="button" onClick={onReturnToAi} className="hidden md:inline-flex items-center gap-1.5 rounded-[5px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700 transition-all hover:bg-emerald-100">
            <Bot size={14} /> Return to AI
          </button>
        ) : null}
        <button className="p-2.5 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[5px] transition-all"><Video size={20} /></button>
        <button className="p-2.5 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[5px] transition-all"><Phone size={18} /></button>
        <div className="w-px h-6 bg-slate-100 mx-1" />
        <div ref={headerMenuRef} className="relative">
          <button type="button" onClick={onMenuToggle} className={cn("inline-flex p-2.5 rounded-[5px] transition-all", menuOpen ? "bg-brand-50 text-brand-600" : "hover:bg-slate-50 text-slate-400 hover:text-slate-900")} aria-label="Info">
            <EllipsisVertical size={20} />
          </button>
          {menuOpen ? (
            <>
              <HeaderMenu mobile aiState={aiState} onAssignHuman={onAssignHuman} onEdit={onEdit} onClearChat={onClearChat} onReturnToAi={onReturnToAi} onShowProfile={onShowProfile} onTakeOver={onTakeOver} onTakeOverAndAssign={onTakeOverAndAssign} />
              <HeaderMenu aiState={aiState} onAssignHuman={onAssignHuman} onEdit={onEdit} onClearChat={onClearChat} onReturnToAi={onReturnToAi} onTakeOver={onTakeOver} onTakeOverAndAssign={onTakeOverAndAssign} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HeaderMenu({ mobile, aiState, onAssignHuman, onClearChat, onEdit, onReturnToAi, onShowProfile, onTakeOver, onTakeOverAndAssign }: { mobile?: boolean; aiState?: Conversation["aiState"]; onAssignHuman?: () => void; onClearChat: () => void; onEdit: () => void; onReturnToAi?: () => void; onShowProfile?: () => void; onTakeOver?: () => void; onTakeOverAndAssign?: () => void }) {
  return (
    <div className={`${mobile ? "md:hidden w-44" : "hidden md:block w-56"} absolute right-0 top-12 z-30 overflow-hidden rounded-[10px] border border-slate-100 bg-white shadow-xl`}>
      {mobile ? (
        <button type="button" onClick={onShowProfile} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
          <Info size={16} /> View profile
        </button>
      ) : null}
      {(aiState === AI_STATES.AI_ACTIVE || aiState === AI_STATES.HANDOVER_PENDING) && onTakeOver ? (
        <button type="button" onClick={onTakeOver} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold text-amber-700 hover:bg-amber-50">
          <Hand size={16} /> Take over
        </button>
      ) : null}
      {(aiState === AI_STATES.HANDOVER_PENDING || aiState === AI_STATES.HUMAN_ACTIVE) && onAssignHuman ? (
        <button type="button" onClick={onAssignHuman} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold text-sky-700 hover:bg-sky-50">
          <Hand size={16} /> Assign human
        </button>
      ) : null}
      {(aiState === AI_STATES.AI_ACTIVE || aiState === AI_STATES.HANDOVER_PENDING) && onTakeOverAndAssign ? (
        <button type="button" onClick={onTakeOverAndAssign} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold text-brand-700 hover:bg-brand-50">
          <Hand size={16} /> Take over & assign
        </button>
      ) : null}
      {aiState === AI_STATES.HUMAN_ACTIVE && onReturnToAi ? (
        <button type="button" onClick={onReturnToAi} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50">
          <Bot size={16} /> Return to AI
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
