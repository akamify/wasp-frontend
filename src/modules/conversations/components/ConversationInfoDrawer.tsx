import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Edit3, Languages, Mail, StickyNote, Tag, X, ListFilter } from "lucide-react";
import type { Conversation } from "@modules/conversations/types/conversations.types";
import { formatDurationShort } from "@modules/conversations/utils/timeFormat";
import { cn } from "@shared/utils/cn";

type Props = {
  activeConversation: Conversation | null;
  contactDetail: any | null;
  customerServiceWindowOpen: boolean;
  phone: string;
  showMobile: boolean;
  windowRemainingMs: number;
  onCloseMobile: () => void;
  onEdit: () => void;
};

export function ConversationInfoDrawer({ activeConversation, contactDetail, customerServiceWindowOpen, phone, showMobile, windowRemainingMs, onCloseMobile, onEdit }: Props) {
  const mobileDrawer = createPortal(
    <AnimatePresence>
      {showMobile && activeConversation ? (
        <motion.div className="md:hidden fixed inset-0 z-[999]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" className="absolute inset-0 bg-slate-900/25 backdrop-blur-[1px]" aria-label="Close profile" onClick={onCloseMobile} />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 35 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-none bg-white shadow-2xl border-l border-slate-200 flex flex-col"
          >
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
              <div className="text-sm font-black text-slate-900 tracking-tight">Contact info</div>
              <button type="button" onClick={onCloseMobile} className="p-2 hover:bg-slate-50 rounded-[5px] text-slate-500 hover:text-slate-900 transition-all" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <ContactInfoBody
              activeConversation={activeConversation}
              contactDetail={contactDetail}
              customerServiceWindowOpen={customerServiceWindowOpen}
              phone={phone}
              windowRemainingMs={windowRemainingMs}
              onEdit={onEdit}
              mobile
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );

  return (
    <>
      {phone ? (
        <div className="hidden md:flex w-[340px] bg-white border-l border-slate-200 overflow-y-auto flex-col shrink-0">
          <ContactInfoBody
            activeConversation={activeConversation}
            contactDetail={contactDetail}
            customerServiceWindowOpen={customerServiceWindowOpen}
            phone={phone}
            windowRemainingMs={windowRemainingMs}
            onEdit={onEdit}
          />
        </div>
      ) : null}

      {mobileDrawer}
    </>
  );
}

type ContactInfoBodyProps = Omit<Props, "onCloseMobile" | "showMobile"> & { mobile?: boolean };

function ContactInfoBody({ activeConversation, contactDetail, customerServiceWindowOpen, phone, windowRemainingMs, onEdit, mobile }: ContactInfoBodyProps) {
  return (
    <div className={`${mobile ? "overflow-y-auto custom-scrollbar" : ""} p-6 flex flex-col`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-12 w-12 rounded-[10px] bg-slate-100 overflow-hidden shadow-sm shrink-0">
          <img src={`https://ui-avatars.com/api/?name=${contactDetail?.name || phone}&background=random`} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-black text-slate-900">{contactDetail?.name || activeConversation?.contact?.name || "Unknown"}</div>
          <div className="text-xs font-bold text-slate-400">{`+${phone}`}</div>
        </div>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-[5px] border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
          <Edit3 size={14} /> Edit
        </button>
      </div>
      <div className="mt-5 rounded-[12px] border border-slate-100 bg-slate-50/60 p-4">
        <div className="flex items-start flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className={cn("h-2.5 w-2.5 rounded-full", customerServiceWindowOpen ? "bg-emerald-500" : "bg-rose-500")} />
            <div className="text-xs font-black uppercase tracking-widest text-slate-600">
              {customerServiceWindowOpen ? "Window Open" : "Window Closed"}
            </div>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {customerServiceWindowOpen ? `${formatDurationShort(windowRemainingMs)} left` : "Closed"}
          </span>
        </div>
      </div>
      <ContactInfoFields contactDetail={contactDetail} />
    </div>
  );
}

function ContactInfoFields({ contactDetail }: { contactDetail: any | null }) {
  const tags = Array.isArray(contactDetail?.tags) ? contactDetail.tags : [];
  const attributes =
    contactDetail?.attributes && typeof contactDetail.attributes === "object"
      ? Object.entries(contactDetail.attributes).filter(([key]) => String(key || "").trim())
      : [];
  return (
    <div className="mt-5 space-y-3">
      <InfoField icon={<Mail size={12} />} label="Email">{contactDetail?.email || "Not set"}</InfoField>
      <InfoField icon={<Languages size={12} />} label="Language">{contactDetail?.language || "Not set"}</InfoField>
      <div className="rounded-[5px] border border-slate-100 bg-white p-4">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><Tag size={12} /> Tags</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.length ? tags.slice(0, 10).map((tag: string) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{tag}</span>) : <span className="text-sm font-bold text-slate-900">Not set</span>}
        </div>
      </div>
      <div className="rounded-[5px] border border-slate-100 bg-white p-4">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><ListFilter size={12} /> Attributes</div>
        <div className="mt-2 space-y-1.5">
          {attributes.length ? (
            attributes.slice(0, 12).map(([key, value]) => (
              <div key={String(key)} className="flex items-center justify-between gap-3 rounded-[5px] bg-slate-50 px-2.5 py-1.5 text-xs">
                <span className="font-black text-slate-600">{String(key)}</span>
                <span className="font-semibold text-slate-900">{String(value ?? "")}</span>
              </div>
            ))
          ) : (
            <span className="text-sm font-bold text-slate-900">Not set</span>
          )}
        </div>
      </div>
      <InfoField icon={<StickyNote size={12} />} label="Notes" multiline>{contactDetail?.notes || "Not set"}</InfoField>
    </div>
  );
}

function InfoField({ children, icon, label, multiline }: { children: React.ReactNode; icon: React.ReactNode; label: string; multiline?: boolean }) {
  return (
    <div className="rounded-[5px] border border-slate-100 bg-white p-4">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{icon} {label}</div>
      <div className={`mt-2 text-sm ${multiline ? "font-semibold text-slate-800 whitespace-pre-wrap" : "font-bold text-slate-900"}`}>{children}</div>
    </div>
  );
}
