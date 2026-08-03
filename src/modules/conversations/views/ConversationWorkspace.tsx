import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, CheckCheck, Info, MessageSquare } from "lucide-react";
import { API } from "@api/api";
import { AssignLeadModal } from "@modules/crm/components/AssignLeadModal";
import { ChatHeader } from "@modules/conversations/components/ChatHeader";
import { ConversationFeedback } from "@modules/conversations/components/ConversationFeedback";
import { ConversationInfoDrawer } from "@modules/conversations/components/ConversationInfoDrawer";
import { ConversationTimelineModal } from "@modules/conversations/components/ConversationTimelineModal";
import { ConversationsSidebar } from "@modules/conversations/components/ConversationsSidebar";
import { EditContactModal } from "@modules/conversations/components/EditContactModal";
import { ImagePreviewModal } from "@modules/conversations/components/ImagePreviewModal";
import { InboxComposer } from "@modules/conversations/components/InboxComposer";
import { MessageContent } from "@modules/conversations/components/MessageContent";
import { MessagesPanel } from "@modules/conversations/components/MessagesPanel";
import { useContactEditor } from "@modules/conversations/hooks/useContactEditor";
import { type ConversationListParams, useConversationsList } from "@modules/conversations/hooks/useConversationsList";
import { useConversationMessages } from "@modules/conversations/hooks/useConversationMessages";
import { useCustomerServiceWindow } from "@modules/conversations/hooks/useCustomerServiceWindow";
import { getErrorMessage, useMessageActions } from "@modules/conversations/hooks/useMessageActions";
import type { ChatMessage, Conversation } from "@modules/conversations/types/conversations.types";
import {
  extractMetaDebugFields,
  formatMetaDebugInline,
  isMetaBillingEligibilityPaymentIssue,
} from "@shared/utils/metaErrors";
import { cn } from "@shared/utils/cn";
import { Seo } from "@shared/components/Seo";
import { BRAND_NAME } from "@shared/config/brand";

type ReplyContext = {
  promptText: string;
};

type Props = {
  controlledPhone?: string;
  embedded?: boolean;
  listParams?: ConversationListParams;
  onClearSelection?: () => void;
  onSelectPhone?: (phone: string) => void;
  routeBase?: string;
  searchPlaceholder?: string;
};

export function ConversationWorkspace({
  controlledPhone,
  embedded = false,
  listParams,
  onClearSelection,
  onSelectPhone,
  routeBase = "/app/conversations",
  searchPlaceholder,
}: Props) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [crmEmployees, setCrmEmployees] = useState<any[]>([]);
  const [conversationEvents, setConversationEvents] = useState<any[]>([]);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const activePhone = String(controlledPhone || "").trim();
  const waLink = useMemo(() => {
    const phone = String(activePhone || "").replace(/[^\d]/g, "");
    return phone ? `https://wa.me/${phone}` : "";
  }, [activePhone]);

  const {
    activeConversation,
    filter,
    loadingList,
    refreshListSilently,
    search,
    setFilter,
    setSearch,
    visibleConversations,
  } = useConversationsList({ urlPhone: activePhone, setError, params: listParams });

  const {
    contactDetail,
    conversationDetail,
    loadChat,
    loadingChat,
    messages,
    refreshChatSilently,
    scrollRef,
    setContactDetail,
  } = useConversationMessages({ navigate, refreshListSilently, search, setError, urlPhone: activePhone });

  const resolvedConversation = useMemo<Conversation | null>(() => {
    if (!activeConversation && !conversationDetail) return null;
    return {
      ...(activeConversation || {}),
      ...(conversationDetail || {}),
      phone: String(conversationDetail?.phone || activeConversation?.phone || activePhone || ""),
      contact: activeConversation?.contact || (conversationDetail as any)?.contact || null,
    };
  }, [activeConversation, activePhone, conversationDetail]);

  const { customerServiceWindowOpen, windowRemainingMs } = useCustomerServiceWindow(resolvedConversation, messages);
  const { ensureMediaUrl, mediaErrors, mediaLoading, mediaUrls, selectedImage, setSelectedImage } = useMessageActions(messages);
  const conversationName = String(contactDetail?.name || resolvedConversation?.contact?.name || activePhone).trim();
  const pageTitle = activePhone
    ? `${conversationName} | Inbox | ${BRAND_NAME}`
    : `Inbox | ${BRAND_NAME}`;
  const pageDescription = `WhatsApp conversation with ${conversationName}. Reply, manage messages, and track delivery status in ${BRAND_NAME}.`;
  const { definitions, editBusy, editForm, editOpen, openEdit, saveEdit, setEditForm, setEditOpen } = useContactEditor({
    contactDetail,
    refreshListSilently,
    setContactDetail,
    setError,
    setOk,
    urlPhone: activePhone,
  });

  useEffect(() => {
    setMenuOpen(false);
    setShowProfile(false);
  }, [activePhone]);

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

  useEffect(() => {
    if (!activePhone) {
      setConversationEvents([]);
      return;
    }
    let cancelled = false;
    Promise.allSettled([
      API.crm?.conversationEvents ? API.crm.conversationEvents(activePhone, { limit: 12 }) : Promise.resolve({ items: [] }),
      API.crm?.employees ? API.crm.employees() : Promise.resolve({ items: [] }),
    ])
      .then(([eventsRes, employeesRes]) => {
        if (cancelled) return;
        const nextEvents =
          eventsRes.status === "fulfilled"
            ? Array.isArray(eventsRes.value?.items)
              ? eventsRes.value.items
              : []
            : [];
        const employeePayload = employeesRes.status === "fulfilled" ? employeesRes.value : { items: [] };
        const nextEmployees = Array.isArray(employeePayload?.items)
          ? employeePayload.items
          : Array.isArray(employeePayload)
            ? employeePayload
            : [];
        setConversationEvents(nextEvents);
        setCrmEmployees(nextEmployees);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activePhone]);

  const selectPhone = (phone: string) => {
    if (onSelectPhone) {
      onSelectPhone(phone);
      return;
    }
    navigate(`${routeBase}/${encodeURIComponent(phone)}`);
  };

  const clearSelection = () => {
    setShowProfile(false);
    setMenuOpen(false);
    if (onClearSelection) {
      onClearSelection();
      return;
    }
    navigate(routeBase);
  };

  const clearChat = async () => {
    if (!activePhone) return;
    const confirmed = window.confirm("Clear this chat? This will delete all messages for this conversation.");
    if (!confirmed) return;
    try {
      await API.conversations.clear(activePhone);
      setMenuOpen(false);
      await loadChat(activePhone);
      await refreshListSilently();
      setOk("Chat cleared");
      window.setTimeout(() => setOk(null), 2000);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to clear chat");
    }
  };

  const refreshConversationEvents = async () => {
    if (!activePhone || !API.crm?.conversationEvents) return;
    const result = await API.crm.conversationEvents(activePhone, { limit: 12 });
    setConversationEvents(Array.isArray(result?.items) ? result.items : []);
  };

  const handleTakeOver = async () => {
    if (!activePhone) return;
    const reason = window.prompt("Reason for human takeover?", resolvedConversation?.aiHandoverReason || "manual_takeover");
    if (reason === null) return;
    try {
      await API.conversations.takeOver(activePhone, { reason });
      setMenuOpen(false);
      await Promise.all([loadChat(activePhone), refreshListSilently(), refreshConversationEvents()]);
      setOk("Conversation moved to human takeover");
      window.setTimeout(() => setOk(null), 2500);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to take over conversation");
    }
  };

  const handleReturnToAi = async () => {
    if (!activePhone) return;
    const reason = window.prompt("Optional note before returning to AI:", "");
    if (reason === null) return;
    try {
      await API.conversations.returnToAi(activePhone, { reason });
      setMenuOpen(false);
      await Promise.all([loadChat(activePhone), refreshListSilently(), refreshConversationEvents()]);
      setOk("Conversation returned to AI");
      window.setTimeout(() => setOk(null), 2500);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to return conversation to AI");
    }
  };

  const handleAssignEmployee = async (employeeId: string, reason: string) => {
    if (!activePhone) return;
    await API.crm.manualAssignLead(activePhone, {
      employeeId,
      reason: reason || "ai_handover_assignment",
    });
    await Promise.all([loadChat(activePhone), refreshListSilently(), refreshConversationEvents()]);
    setAssignOpen(false);
    setOk("Employee assigned for takeover");
    window.setTimeout(() => setOk(null), 2500);
  };

  return (
    <div className={cn("flex bg-white overflow-hidden relative min-h-0", embedded ? "h-full" : "h-dvh lg:h-full")}>
      {!embedded ? <Seo title={pageTitle} description={pageDescription} robots="noindex,nofollow" /> : null}

      <ConversationsSidebar
        activePhone={activePhone}
        conversations={visibleConversations}
        filter={filter}
        loading={loadingList}
        search={search}
        searchPlaceholder={searchPlaceholder}
        onFilterChange={setFilter}
        onSearchChange={setSearch}
        onSelect={selectPhone}
      />

      <div className={cn("flex-1 min-w-0 flex flex-col bg-[#F8FAFC] relative min-h-0", !activePhone ? "hidden md:flex" : "flex")}>
        {activePhone ? (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 320, damping: 34 }} className="flex h-full min-h-0 min-w-0 flex-col">
            <ChatHeader
              activeConversation={resolvedConversation}
              contactDetail={contactDetail}
              customerServiceWindowOpen={customerServiceWindowOpen}
              headerMenuRef={headerMenuRef}
              menuOpen={menuOpen}
              phone={activePhone}
              waLink={waLink}
              onBack={clearSelection}
              onClearChat={() => void clearChat()}
              onEdit={() => {
                setMenuOpen(false);
                openEdit();
              }}
              onReturnToAi={() => void handleReturnToAi()}
              onTakeOver={() => void handleTakeOver()}
              onTakeOverAndAssign={() => {
                setMenuOpen(false);
                setAssignOpen(true);
              }}
              onAssignHuman={() => {
                setMenuOpen(false);
                setAssignOpen(true);
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
                  replyContext={findInteractiveReplyContext(messages, message)}
                  setSelectedImage={setSelectedImage}
                />
              )}
              renderMetaBillingGuidance={renderMetaBillingGuidance}
              statusMark={statusMark}
            />
            <ComposerPanel
              customerServiceWindowOpen={customerServiceWindowOpen}
              refreshChat={() => void refreshChatSilently(activePhone)}
              setError={setError}
              setOk={setOk}
              urlPhone={activePhone}
            />
          </motion.div>
        ) : (
          <EmptyConversationState />
        )}
        <ConversationFeedback error={error} ok={ok} onClear={() => { setError(null); setOk(null); }} />
      </div>

      <ConversationInfoDrawer
        activeConversation={resolvedConversation}
        contactDetail={contactDetail}
        customerServiceWindowOpen={customerServiceWindowOpen}
        events={conversationEvents}
        phone={activePhone}
        showMobile={showProfile}
        windowRemainingMs={windowRemainingMs}
        onCloseMobile={() => setShowProfile(false)}
        onEdit={openEdit}
        onOpenTimeline={() => setTimelineOpen(true)}
      />
      <ConversationTimelineModal
        events={conversationEvents}
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        phone={activePhone}
      />
      <AssignLeadModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        phone={activePhone || ""}
        employees={crmEmployees || []}
        onAssign={handleAssignEmployee}
      />

      <EditContactModal
        busy={editBusy}
        definitions={definitions.filter((definition: any) => definition.active && definition.visible)}
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

function findInteractiveReplyContext(messages: ChatMessage[], message: ChatMessage): ReplyContext | null {
  if (message.direction !== "inbound") return null;
  const inboundInteractive = getMessageInteractive(message);
  const type = String(message.type || inboundInteractive?.type || "").toLowerCase();
  const isButtonReply = type === "button_reply" || !!inboundInteractive?.button_reply || !!message.buttonReply?.id;
  const isListReply = type === "list_reply" || !!inboundInteractive?.list_reply || !!message.listReply?.id;
  if (!isButtonReply && !isListReply) return null;

  const replyId = String(
    message.buttonReply?.id ||
      message.listReply?.id ||
      inboundInteractive?.button_reply?.id ||
      inboundInteractive?.list_reply?.id ||
      ""
  ).trim();
  const replyTitle = String(
    message.buttonReply?.title ||
      message.listReply?.title ||
      inboundInteractive?.button_reply?.title ||
      inboundInteractive?.list_reply?.title ||
      message.displayText ||
      message.text ||
      ""
  ).trim();

  const currentIndex = messages.findIndex((item) => item._id === message._id);
  const previousMessages = currentIndex >= 0 ? messages.slice(0, currentIndex).reverse() : [...messages].reverse();
  const quotedMessageId = String(message.replyToMessageId || (message.payload as any)?.context?.id || "").trim();
  if (quotedMessageId) {
    const quotedMessage = previousMessages.find((candidate) => String(candidate.whatsappMessageId || "") === quotedMessageId);
    if (quotedMessage) return { promptText: getPromptText(quotedMessage) };
  }

  for (const candidate of previousMessages) {
    if (candidate.direction !== "outbound") continue;
    if (!isInteractivePrompt(candidate)) continue;
    if (isButtonReply && promptHasButton(candidate, replyId, replyTitle)) {
      return { promptText: getPromptText(candidate) };
    }
    if (isListReply && promptHasListRow(candidate, replyId, replyTitle)) {
      return { promptText: getPromptText(candidate) };
    }
  }

  const fallbackPrompt =
    previousMessages.find((candidate) => candidate.direction === "outbound" && isInteractivePrompt(candidate)) ||
    previousMessages.find((candidate) => candidate.direction === "outbound" && getPromptText(candidate));
  return fallbackPrompt ? { promptText: getPromptText(fallbackPrompt) } : null;
}

function isInteractivePrompt(message: ChatMessage) {
  const interactive = getMessageInteractive(message);
  return (
    message.type === "interactive_buttons" ||
    message.type === "interactive_list" ||
    Array.isArray(message.buttons) ||
    interactive?.type === "button" ||
    interactive?.type === "list"
  );
}

function getPromptText(message: ChatMessage) {
  const interactive = getMessageInteractive(message);
  return String(message.displayText || message.previewText || message.text || interactive?.body?.text || "").trim();
}

function promptHasButton(message: ChatMessage, replyId: string, replyTitle: string) {
  const interactive = getMessageInteractive(message);
  const payloadButtons = Array.isArray(interactive?.action?.buttons)
    ? interactive.action.buttons.map((button: any) => button?.reply || button)
    : [];
  const buttons = [...(message.buttons || []), ...payloadButtons] as Array<{ id?: string; title?: string }>;
  return buttons.some((button) => {
    const id = String(button?.id || "").trim();
    const title = String(button?.title || "").trim();
    return (replyId && id === replyId) || (replyTitle && title.toLowerCase() === replyTitle.toLowerCase());
  });
}

function promptHasListRow(message: ChatMessage, replyId: string, replyTitle: string) {
  const interactive = getMessageInteractive(message);
  const sections = Array.isArray(interactive?.action?.sections) ? interactive.action.sections : [];
  return sections.some((section: any) =>
    (section?.rows || []).some((row: any) => {
      const id = String(row?.id || "").trim();
      const title = String(row?.title || "").trim();
      return (replyId && id === replyId) || (replyTitle && title.toLowerCase() === replyTitle.toLowerCase());
    })
  );
}

function getMessageInteractive(message: ChatMessage) {
  return (message.interactive || message.payload?.interactive || {}) as any;
}

function ComposerPanel({
  customerServiceWindowOpen,
  refreshChat,
  setError,
  setOk,
  urlPhone,
}: {
  customerServiceWindowOpen: boolean;
  refreshChat: () => void;
  setError: (value: string) => void;
  setOk: (value: string | null) => void;
  urlPhone: string;
}) {
  return (
    <div className="min-w-0 p-4 bg-white border-t border-slate-100 shrink-0">
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
    <div className="max-w-full space-y-1.5">
      <div className="text-[10px] font-black uppercase tracking-widest text-rose-700">Meta billing / eligibility issue</div>
      <div className="text-[10px] font-bold leading-relaxed text-rose-700/90">
        Payment setup or business verification is required in Meta WhatsApp Manager.
      </div>
      <details className="group">
        <summary className="cursor-pointer select-none text-[10px] font-black text-rose-700/80 outline-none hover:text-rose-700 focus-visible:ring-2 focus-visible:ring-rose-200">
          View fix details
        </summary>
        <div className="mt-1 space-y-1 rounded-[4px] bg-rose-50/70 p-2 text-[9.5px] font-bold leading-relaxed text-rose-700/80">
          <div>Meta Business Manager -&gt; WhatsApp Manager -&gt; Payment method / billing setup + business verification.</div>
          <div>{provider}</div>
          {debug ? <div className="text-rose-700/65">{debug}</div> : null}
        </div>
      </details>
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
