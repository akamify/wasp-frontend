import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck, Info, MessageSquare } from "lucide-react";
import { API } from "@api/api";
import { ChatHeader } from "@modules/conversations/components/ChatHeader";
import { ConversationFeedback } from "@modules/conversations/components/ConversationFeedback";
import { ConversationInfoDrawer } from "@modules/conversations/components/ConversationInfoDrawer";
import { ConversationsSidebar } from "@modules/conversations/components/ConversationsSidebar";
import { EditContactModal } from "@modules/conversations/components/EditContactModal";
import { ImagePreviewModal } from "@modules/conversations/components/ImagePreviewModal";
import { InboxComposer } from "@modules/conversations/components/InboxComposer";
import { MessageContent } from "@modules/conversations/components/MessageContent";
import { MessagesPanel } from "@modules/conversations/components/MessagesPanel";
import { useContactEditor } from "@modules/conversations/hooks/useContactEditor";
import { useConversationMessages } from "@modules/conversations/hooks/useConversationMessages";
import { useConversationParams } from "@modules/conversations/hooks/useConversationParams";
import { useConversationsList } from "@modules/conversations/hooks/useConversationsList";
import { useCustomerServiceWindow } from "@modules/conversations/hooks/useCustomerServiceWindow";
import { getErrorMessage, useMessageActions } from "@modules/conversations/hooks/useMessageActions";
import type { ChatMessage } from "@modules/conversations/types/conversations.types";
import {
  extractMetaDebugFields,
  formatMetaDebugInline,
  isMetaBillingEligibilityPaymentIssue,
} from "@shared/utils/metaErrors";
import { cn } from "@shared/utils/cn";

export function ConversationsView() {
  const { navigate, urlPhone, waLink } = useConversationParams();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  const {
    activeConversation,
    filter,
    loadingList,
    refreshListSilently,
    search,
    setFilter,
    setSearch,
    visibleConversations,
  } = useConversationsList(urlPhone, setError);

  const {
    contactDetail,
    loadChat,
    loadingChat,
    messages,
    refreshChatSilently,
    scrollRef,
    setContactDetail,
  } = useConversationMessages({ navigate, refreshListSilently, search, setError, urlPhone });

  const { customerServiceWindowOpen, windowRemainingMs } = useCustomerServiceWindow(activeConversation, messages);
  const { ensureMediaUrl, mediaErrors, mediaLoading, mediaUrls, selectedImage, setSelectedImage } = useMessageActions(messages);
  const { editBusy, editForm, editOpen, openEdit, saveEdit, setEditForm, setEditOpen } = useContactEditor({
    contactDetail,
    refreshListSilently,
    setContactDetail,
    setError,
    setOk,
    urlPhone,
  });

  useEffect(() => {
    setMenuOpen(false);
    setShowProfile(false);
  }, [urlPhone]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: MouseEvent) => {
      const el = headerMenuRef.current;
      if (!el) return;
      if (event.target instanceof Node && el.contains(event.target)) return;
      setMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown, true);
    return () => window.removeEventListener("mousedown", onDown, true);
  }, [menuOpen]);

  const clearChat = async () => {
    if (!urlPhone) return;
    const confirmed = window.confirm("Clear this chat? This will delete all messages for this conversation.");
    if (!confirmed) return;
    try {
      await API.conversations.clear(urlPhone);
      setMenuOpen(false);
      await loadChat(urlPhone);
      await refreshListSilently();
      setOk("Chat cleared");
      window.setTimeout(() => setOk(null), 2000);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to clear chat");
    }
  };

  return (
    <div className="flex bg-white overflow-hidden relative h-dvh lg:h-full min-h-0">
      <ConversationsSidebar
        activePhone={urlPhone}
        conversations={visibleConversations}
        filter={filter}
        loading={loadingList}
        search={search}
        onFilterChange={setFilter}
        onSearchChange={setSearch}
        onSelect={(phone) => navigate(`/app/conversations/${phone}`)}
      />

      <div className={cn("flex-1 flex flex-col bg-[#F8FAFC] relative min-h-0", !urlPhone ? "hidden md:flex" : "flex")}>
        {urlPhone ? (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 320, damping: 34 }} className="flex h-full min-h-0 flex-col">
            <ChatHeader
              activeConversation={activeConversation}
              contactDetail={contactDetail}
              customerServiceWindowOpen={customerServiceWindowOpen}
              headerMenuRef={headerMenuRef}
              menuOpen={menuOpen}
              phone={urlPhone}
              waLink={waLink}
              onBack={() => {
                setShowProfile(false);
                setMenuOpen(false);
                navigate("/app/conversations");
              }}
              onClearChat={() => void clearChat()}
              onEdit={() => {
                setMenuOpen(false);
                openEdit();
              }}
              onMenuToggle={() => setMenuOpen((value) => !value)}
              onShowProfile={() => {
                setMenuOpen(false);
                setShowProfile(true);
              }}
            />
            <MessagesPanel
              getErrorMessage={getErrorMessage}
              loading={loadingChat}
              messages={messages}
              panelRef={scrollRef}
              renderMessageContent={(message) => (
                <MessageContent
                  ensureMediaUrl={(id) => void ensureMediaUrl(id)}
                  mediaErrors={mediaErrors}
                  mediaLoading={mediaLoading}
                  mediaUrls={mediaUrls}
                  message={message}
                  setSelectedImage={setSelectedImage}
                />
              )}
              renderMetaBillingGuidance={renderMetaBillingGuidance}
              statusMark={statusMark}
            />
            <ComposerPanel
              customerServiceWindowOpen={customerServiceWindowOpen}
              refreshChat={() => void refreshChatSilently(urlPhone)}
              setError={setError}
              setOk={setOk}
              urlPhone={urlPhone}
            />
          </motion.div>
        ) : (
          <EmptyConversationState />
        )}
        <ConversationFeedback error={error} ok={ok} onClear={() => { setError(null); setOk(null); }} />
      </div>

      <ConversationInfoDrawer
        activeConversation={activeConversation}
        contactDetail={contactDetail}
        customerServiceWindowOpen={customerServiceWindowOpen}
        phone={urlPhone}
        showMobile={showProfile}
        windowRemainingMs={windowRemainingMs}
        onCloseMobile={() => setShowProfile(false)}
        onEdit={openEdit}
      />

      <EditContactModal
        busy={editBusy}
        form={editForm}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onFormChange={setEditForm}
        onSave={() => void saveEdit()}
      />
      <ImagePreviewModal image={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
}

function ComposerPanel({ customerServiceWindowOpen, refreshChat, setError, setOk, urlPhone }: { customerServiceWindowOpen: boolean; refreshChat: () => void; setError: (value: string) => void; setOk: (value: string | null) => void; urlPhone: string }) {
  return (
    <div className="p-4 bg-white border-t border-slate-100 shrink-0">
      {!customerServiceWindowOpen && (
        <div className="mb-4 bg-amber-50 border border-amber-100 p-3 rounded-[5px] flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-[5px]"><Info size={16} /></div>
          <div>
            <p className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Window Closed</p>
            <p className="text-[10px] font-bold text-amber-700/80 leading-relaxed">The 24-hour customer service window has expired. Please use a template to re-engage.</p>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        <InboxComposer
          to={urlPhone}
          disabled={!urlPhone}
          forceDisabledReason={customerServiceWindowOpen ? undefined : "Customer service window is closed"}
          sendTextMessage={API.messages.sendText}
          uploadMedia={API.messages.uploadMedia}
          sendMediaMessage={API.messages.sendMedia}
          onSent={(message) => {
            setOk(message);
            refreshChat();
            setTimeout(() => setOk(null), 3000);
          }}
          onError={setError}
        />
      </div>
    </div>
  );
}

function EmptyConversationState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/50">
      <div className="h-24 w-24 bg-brand-100 rounded-[20px] flex items-center justify-center text-brand-600 mb-6 shadow-inner">
        <MessageSquare size={48} />
      </div>
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Inbox</h2>
      <p className="mt-2 text-slate-500 font-bold max-w-sm">Select a conversation from the sidebar to start messaging. All your WhatsApp interactions are synced in real-time.</p>
    </div>
  );
}

function renderMetaBillingGuidance(err: any) {
  const provider = getErrorMessage(err);
  const debug = formatMetaDebugInline(extractMetaDebugFields(err));
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-black uppercase tracking-widest text-rose-700">Meta billing / eligibility issue</div>
      <div className="text-[10px] font-bold leading-relaxed text-rose-700/90">Fix: Meta Business Manager -&gt; WhatsApp Manager -&gt; Payment method / billing setup + business verification.</div>
      <div className="text-[10px] font-bold text-rose-700/80">{provider}</div>
      {debug ? <div className="text-[9px] font-bold text-rose-700/70">{debug}</div> : null}
    </div>
  );
}

function statusMark(message: ChatMessage) {
  if (message.direction !== "outbound") return null;
  const status = String(message.status || "").toLowerCase();
  const timestamps = (message as any).statusTimestamps || {};
  const isRead = status === "read" || Boolean(timestamps?.readAt);
  const isDelivered = status === "delivered" || Boolean(timestamps?.deliveredAt);
  if (status === "failed" || status === "timeout_unknown") return <span className="ml-1 text-[10px] font-black text-rose-600">!</span>;
  if (isRead) return <CheckCheck className="ml-1 inline-block text-blue-600" size={14} strokeWidth={3} />;
  if (isDelivered) return <CheckCheck className="ml-1 inline-block text-ink-900/55" size={14} strokeWidth={3} />;
  return <Check className="ml-1 inline-block text-ink-900/55" size={14} strokeWidth={3} />;
}
