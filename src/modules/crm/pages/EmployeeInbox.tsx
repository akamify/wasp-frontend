import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck, Info, MessageSquare } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { ChatHeader } from "@modules/conversations/components/ChatHeader";
import { ConversationFeedback } from "@modules/conversations/components/ConversationFeedback";
import { ConversationInfoDrawer } from "@modules/conversations/components/ConversationInfoDrawer";
import { ConversationsSidebar } from "@modules/conversations/components/ConversationsSidebar";
import { EditContactModal } from "@modules/conversations/components/EditContactModal";
import { ImagePreviewModal } from "@modules/conversations/components/ImagePreviewModal";
import { InboxComposer } from "@modules/conversations/components/InboxComposer";
import { MessageContent } from "@modules/conversations/components/MessageContent";
import { MessagesPanel } from "@modules/conversations/components/MessagesPanel";
import { useCustomerServiceWindow } from "@modules/conversations/hooks/useCustomerServiceWindow";
import { getErrorMessage, useMessageActions } from "@modules/conversations/hooks/useMessageActions";
import type { ChatMessage } from "@modules/conversations/types/conversations.types";
import { cn } from "@shared/utils/cn";
import { crmEmployeeInboxService } from "@modules/crm/services/crmEmployeeInbox.service";
import { useEmployeeConversationsList } from "@modules/crm/hooks/useEmployeeConversationsList";
import { useEmployeeConversationMessages } from "@modules/crm/hooks/useEmployeeConversationMessages";

export default function EmployeeInboxPage() {
  const { phone: urlPhone = "" } = useParams();
  const navigate = useNavigate();
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
  } = useEmployeeConversationsList(urlPhone, setError);

  const {
    contactDetail,
    loadChat,
    loadingChat,
    messages,
    refreshChatSilently,
    scrollRef,
    setContactDetail,
  } = useEmployeeConversationMessages({ navigate, refreshListSilently, search, setError, urlPhone });

  const { customerServiceWindowOpen, windowRemainingMs } = useCustomerServiceWindow(activeConversation, messages);
  const { ensureMediaUrl, mediaErrors, mediaLoading, mediaUrls, selectedImage, setSelectedImage } = useMessageActions(messages as any);

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

  return (
    <div className="flex bg-white overflow-hidden relative h-dvh lg:h-full min-h-0">
      <ConversationsSidebar
        activePhone={urlPhone}
        conversations={visibleConversations}
        filter={filter as any}
        loading={loadingList}
        search={search}
        onFilterChange={setFilter as any}
        onSearchChange={setSearch}
        onSelect={(phone) => navigate(`/employee/inbox/${phone}`)}
      />

      <div className={cn("flex-1 flex flex-col bg-[#F8FAFC] relative min-h-0", !urlPhone ? "hidden md:flex" : "flex")}>
        {urlPhone ? (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 320, damping: 34 }} className="flex h-full min-h-0 flex-col">
            <ChatHeader
              activeConversation={activeConversation as any}
              contactDetail={contactDetail}
              customerServiceWindowOpen={customerServiceWindowOpen}
              headerMenuRef={headerMenuRef}
              menuOpen={menuOpen}
              phone={urlPhone}
              waLink={urlPhone ? `https://wa.me/${String(urlPhone).replace(/[^\d]/g, "")}` : ""}
              onBack={() => navigate("/employee/inbox")}
              onMenuToggle={() => setMenuOpen((v) => !v)}
              onShowProfile={() => setShowProfile(true)}
              onEdit={() => setError("Contact edit is not enabled for employees.")}
              onClearChat={() => setError("Employees cannot clear chats.")}
            />

            <div className="flex-1 overflow-hidden min-h-0">
              <MessagesPanel
                panelRef={scrollRef as any}
                loading={loadingChat}
                messages={messages as any}
                getErrorMessage={getErrorMessage}
                renderMetaBillingGuidance={() => null}
                renderMessageContent={(message: ChatMessage) => (
                  <MessageContent
                    message={message}
                    ensureMediaUrl={ensureMediaUrl}
                    mediaErrors={mediaErrors}
                    mediaLoading={mediaLoading}
                    mediaUrls={mediaUrls}
                    setSelectedImage={setSelectedImage}
                  />
                )}
                statusMark={statusMark as any}
              />
              <ComposerPanel
                customerServiceWindowOpen={customerServiceWindowOpen}
                refreshChat={() => void refreshChatSilently(urlPhone)}
                setError={setError}
                setOk={setOk}
                urlPhone={urlPhone}
              />
            </div>
          </motion.div>
        ) : (
          <EmptyConversationState />
        )}
        <ConversationFeedback error={error} ok={ok} onClear={() => { setError(null); setOk(null); }} />
      </div>

      <ConversationInfoDrawer
        activeConversation={activeConversation as any}
        contactDetail={contactDetail}
        customerServiceWindowOpen={customerServiceWindowOpen}
        phone={urlPhone}
        showMobile={showProfile}
        windowRemainingMs={windowRemainingMs}
        onCloseMobile={() => setShowProfile(false)}
        onEdit={() => setError("Contact edit is not enabled for employees.")}
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
          sendTextMessage={(payload) => crmEmployeeInboxService.messages.sendText(payload)}
          uploadMedia={(file, onProgress) => crmEmployeeInboxService.messages.uploadMedia(file, onProgress)}
          sendMediaMessage={(payload) => crmEmployeeInboxService.messages.sendMedia(payload)}
          onSent={(message) => {
            setOk(message);
            refreshChat();
            setTimeout(() => setOk(null), 3000);
          }}
          onError={(e) => setError(getErrorMessage(e))}
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
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Employee Inbox</h2>
      <p className="mt-2 text-slate-500 font-bold max-w-sm">Select an assigned conversation from the sidebar to start messaging.</p>
    </div>
  );
}

function statusMark(message: ChatMessage) {
  if (message.direction !== "outbound") return null;
  const status = String(message.status || "").toLowerCase();
  if (status === "failed" || status === "timeout_unknown") return <span className="ml-1 text-[10px] font-black text-rose-600">!</span>;
  if (status === "read") return <CheckCheck className="ml-1 inline-block text-blue-600" size={14} strokeWidth={3} />;
  if (status === "delivered") return <CheckCheck className="ml-1 inline-block text-ink-900/55" size={14} strokeWidth={3} />;
  return <Check className="ml-1 inline-block text-ink-900/55" size={14} strokeWidth={3} />;
}
