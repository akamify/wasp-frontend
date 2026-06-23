import { useEffect, useMemo, useState } from "react";
import type { ChatMessage, Conversation } from "@modules/conversations/types/conversations.types";

export function useCustomerServiceWindow(activeConversation: Conversation | null, messages: ChatMessage[]) {
  void messages;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const expiresAt = useMemo(
    () => new Date(activeConversation?.customerServiceWindowExpiresAt || "").getTime(),
    [activeConversation?.customerServiceWindowExpiresAt]
  );

  const customerServiceWindowOpen = useMemo(() => {
    return activeConversation?.canReply === true &&
      activeConversation?.serviceWindowStatus === "open" &&
      Number.isFinite(expiresAt) &&
      expiresAt > now;
  }, [activeConversation?.canReply, activeConversation?.serviceWindowStatus, expiresAt, now]);

  const windowRemainingMs = useMemo(() => {
    if (!customerServiceWindowOpen) return 0;
    return Math.max(expiresAt - now, 0);
  }, [customerServiceWindowOpen, expiresAt, now]);

  return { customerServiceWindowOpen, windowRemainingMs };
}
