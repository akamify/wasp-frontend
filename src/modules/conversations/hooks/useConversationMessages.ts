import { useCallback, useEffect, useRef, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import { API, getToken, getWorkspaceId } from "@api/api";
import { useInboundMessageTone } from "@modules/conversations/hooks/useInboundMessageTone";
import type { ChatMessage } from "@modules/conversations/types/conversations.types";

const FINAL_MESSAGE_STATUSES = new Set(["read", "delivered", "failed", "timeout_unknown"]);

type Args = {
  navigate: NavigateFunction;
  refreshListSilently: () => Promise<void>;
  search: string;
  setError: (message: string) => void;
  urlPhone: string;
};

export function useConversationMessages({ navigate, refreshListSilently, search, setError, urlPhone }: Args) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [contactDetail, setContactDetail] = useState<any | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const isInitialLoad = useRef(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mergeStatusSnapshot = useCallback((snapshot: any) => {
    const waId = String(snapshot?.waId || snapshot?.message?.whatsappMessageId || "").trim();
    const status = String(snapshot?.status || snapshot?.message?.status || "").toLowerCase();
    const statusTimestamps = snapshot?.statusTimestamps || snapshot?.message?.statusTimestamps || null;
    if (!waId || !status) return false;

    let applied = false;
    setMessages((prev) =>
      prev.map((message) => {
        if (String(message.whatsappMessageId || "") !== waId) return message;
        if (message.direction !== "outbound") return message;
        applied = true;
        return {
          ...message,
          status: status || message.status,
          ...(statusTimestamps ? { statusTimestamps: { ...(message as any).statusTimestamps, ...statusTimestamps } } : {}),
        } as ChatMessage;
      })
    );

    return applied;
  }, []);

  const hydrateOutboundStatuses = useCallback(async (messageList: ChatMessage[]) => {
    const waIds = Array.from(
      new Set(
        (messageList || [])
          .filter(
            (message) =>
              message.direction === "outbound" &&
              String(message.whatsappMessageId || "").trim() &&
              !FINAL_MESSAGE_STATUSES.has(String(message.status || "").toLowerCase())
          )
          .map((message) => String(message.whatsappMessageId || "").trim())
          .filter(Boolean)
      )
    );

    if (!waIds.length) return;

    const snapshots = await Promise.allSettled(waIds.map((waId) => API.messages.status(waId)));
    snapshots.forEach((result, index) => {
      if (result.status !== "fulfilled") return;
      const payload = result.value;
      const waId = waIds[index];
      const status = String(payload?.status || payload?.message?.status || "").toLowerCase();
      if (!waId || !status) return;
      mergeStatusSnapshot({
        waId,
        status,
        statusTimestamps: payload?.statusTimestamps || payload?.message?.statusTimestamps || null,
        message: payload?.message || null,
      });
    });
  }, [mergeStatusSnapshot]);

  const loadChat = useCallback(async (phone: string) => {
    if (!phone) return;
    setLoadingChat(true);
    try {
      const [res, convo] = await Promise.all([API.messages.byPhone(phone), API.conversations.get(phone)]);
      const nextMessages = res.messages || [];
      setMessages(nextMessages);
      setContactDetail(convo?.contact || null);
      await API.conversations.read(phone);
      void hydrateOutboundStatuses(nextMessages);
    } catch {
      setError("Chat load failed");
    } finally {
      setLoadingChat(false);
    }
  }, [hydrateOutboundStatuses, setError]);

  const refreshChatSilently = useCallback(async (phone: string) => {
    if (!phone) return;
    try {
      const res = await API.messages.byPhone(phone);
      const nextMessages = res.messages || [];
      setMessages(nextMessages);
      void hydrateOutboundStatuses(nextMessages);
    } catch {
      // silent refresh
    }
  }, [hydrateOutboundStatuses]);

  const applyRealtimeMessageUpdate = useCallback((payload: any) => {
    const nextMessageId = String(payload?.messageId || payload?.message?._id || "");
    const nextWaId = String(payload?.whatsappMessageId || payload?.message?.whatsappMessageId || "");
    const nextStatus = String(payload?.status || payload?.message?.status || "").toLowerCase();
    const nextPhone = String(payload?.phone || payload?.message?.phone || "");
    const nextTimestamps = payload?.statusTimestamps || payload?.message?.statusTimestamps || null;
    if (!nextMessageId && !nextWaId && !nextStatus) return false;

    let applied = false;
    setMessages((prev) =>
      prev.map((message) => {
        const matches = (nextMessageId && String(message._id) === nextMessageId) || (nextWaId && String(message.whatsappMessageId || "") === nextWaId) || (nextPhone && String(message.phone || "") === nextPhone && message.direction === "outbound");
        if (!matches) return message;
        applied = true;
        return {
          ...message,
          status: nextStatus || message.status,
          ...(nextTimestamps ? { statusTimestamps: { ...(message as any).statusTimestamps, ...nextTimestamps } } : {}),
        } as ChatMessage;
      })
    );
    return applied;
  }, []);

  useInboundMessageTone(messages, urlPhone, loadingChat, navigate);

  useEffect(() => {
    if (urlPhone) {
      void loadChat(urlPhone);
      isInitialLoad.current = true;
    } else {
      setMessages([]);
    }
  }, [urlPhone, loadChat]);

  useEffect(() => {
    if (realtimeConnected) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      void refreshListSilently();
      if (urlPhone) void refreshChatSilently(urlPhone);
    }, 30000);
    return () => window.clearInterval(id);
  }, [urlPhone, search, realtimeConnected, refreshListSilently, refreshChatSilently]);

  useEffect(() => {
    const token = String(getToken() || "").trim();
    const workspaceId = String(getWorkspaceId() || "").trim();
    if (!token || !workspaceId) return;

    const base = String(API.baseUrl || "").replace(/\/+$/, "");
    const streamUrl = `${base}/realtime/stream?token=${encodeURIComponent(token)}&workspaceId=${encodeURIComponent(workspaceId)}`;
    const source = new EventSource(streamUrl);
    source.onopen = () => setRealtimeConnected(true);

    const onRealtimeMessage = (evt: MessageEvent) => {
      try {
        const payload = JSON.parse(String(evt.data || "{}"));
        const eventPhone = String(payload?.phone || "");
        const applied = String(payload?.type || "") === "message_status" ? applyRealtimeMessageUpdate(payload) : false;
        void refreshListSilently();
        if (urlPhone && (!eventPhone || eventPhone === String(urlPhone) || applied)) void refreshChatSilently(urlPhone);
      } catch {
        void refreshListSilently();
        if (urlPhone) void refreshChatSilently(urlPhone);
      }
    };

    source.addEventListener("message", onRealtimeMessage as EventListener);
    source.addEventListener("message.created", onRealtimeMessage as EventListener);
    source.addEventListener("message.status_updated", onRealtimeMessage as EventListener);
    source.addEventListener("conversation.updated", onRealtimeMessage as EventListener);
    source.addEventListener("assignment_changed", onRealtimeMessage as EventListener);
    source.onerror = () => setRealtimeConnected(false);
    return () => {
      source.removeEventListener("message", onRealtimeMessage as EventListener);
      source.removeEventListener("message.created", onRealtimeMessage as EventListener);
      source.removeEventListener("message.status_updated", onRealtimeMessage as EventListener);
      source.removeEventListener("conversation.updated", onRealtimeMessage as EventListener);
      source.removeEventListener("assignment_changed", onRealtimeMessage as EventListener);
      source.close();
      setRealtimeConnected(false);
    };
  }, [urlPhone, search, refreshListSilently, refreshChatSilently]);

  useEffect(() => {
    if (!loadingChat && messages.length > 0) {
      const behavior = isInitialLoad.current ? "instant" : "smooth";
      const scroll = () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: behavior as any });
      scroll();
      const timer = setTimeout(scroll, 150);
      if (isInitialLoad.current) isInitialLoad.current = false;
      return () => clearTimeout(timer);
    }
  }, [messages.length, loadingChat]);

  return { contactDetail, loadChat, loadingChat, messages, refreshChatSilently, scrollRef, setContactDetail };
}
