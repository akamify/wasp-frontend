import { useEffect, useMemo, useState } from "react";
import type { ChatMessage, Conversation } from "@modules/conversations/types/conversations.types";

const CUSTOMER_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

export function useCustomerServiceWindow(activeConversation: Conversation | null, messages: ChatMessage[]) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const lastInboundAt = useMemo(() => {
    const fromConversation = activeConversation?.lastInboundAt ? new Date(activeConversation.lastInboundAt).getTime() : NaN;
    return Number.isFinite(fromConversation) && fromConversation > 0
      ? fromConversation
      : new Date([...messages].reverse().find((m) => m.direction === "inbound" && !!m.createdAt)?.createdAt || "").getTime();
  }, [messages, activeConversation?.lastInboundAt]);

  const customerServiceWindowOpen = useMemo(() => {
    if (!Number.isFinite(lastInboundAt) || lastInboundAt <= 0) return false;
    return now - lastInboundAt < CUSTOMER_SERVICE_WINDOW_MS;
  }, [lastInboundAt, now]);

  const windowRemainingMs = useMemo(() => {
    if (!Number.isFinite(lastInboundAt) || lastInboundAt <= 0) return 0;
    return Math.max(lastInboundAt + CUSTOMER_SERVICE_WINDOW_MS - now, 0);
  }, [lastInboundAt, now]);

  return { customerServiceWindowOpen, windowRemainingMs };
}

