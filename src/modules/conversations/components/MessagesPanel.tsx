import type { ReactNode, RefObject } from "react";
import { ChatMessagesSkeleton } from "@components/ui/Skeletons";
import { MessageBubble } from "@modules/conversations/components/MessageBubble";
import type { ChatMessage } from "@modules/conversations/types/conversations.types";

type Props = {
  getErrorMessage: (error: any) => string;
  loading: boolean;
  messages: ChatMessage[];
  panelRef: RefObject<HTMLDivElement | null>;
  renderMessageContent: (message: ChatMessage) => ReactNode;
  renderMetaBillingGuidance: (error: any) => ReactNode;
  statusMark: (message: ChatMessage) => ReactNode;
};

export function MessagesPanel({ getErrorMessage, loading, messages, panelRef, renderMessageContent, renderMetaBillingGuidance, statusMark }: Props) {
  return (
    <div
      ref={panelRef}
      className="relative flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain px-3 md:px-6 py-4 space-y-3 custom-scrollbar bg-[linear-gradient(180deg,#eefaf4_0%,#f7fbf9_100%)]"
      style={{
        backgroundImage:
          "radial-gradient(rgba(15,23,42,0.12) 1px, transparent 1px), linear-gradient(180deg, rgba(238,250,244,0.92) 0%, rgba(247,251,249,0.96) 100%)",
        backgroundSize: "22px 22px, cover",
        backgroundRepeat: "repeat, no-repeat",
        backgroundPosition: "0 0, 0 0",
      }}
    >
      {loading ? (
        <ChatMessagesSkeleton count={10} />
      ) : (
        messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            getErrorMessage={getErrorMessage}
            renderMetaBillingGuidance={renderMetaBillingGuidance}
            statusMark={statusMark}
          >
            {renderMessageContent(message)}
          </MessageBubble>
        ))
      )}
    </div>
  );
}
