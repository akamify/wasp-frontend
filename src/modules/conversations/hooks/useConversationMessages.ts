import { useCallback, useEffect, useRef, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import { API, getToken, getWorkspaceId } from "@api/api";
import { useInboundMessageTone } from "@modules/conversations/hooks/useInboundMessageTone";
import type { ChatMessage } from "@modules/conversations/types/conversations.types";

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

  const loadChat = useCallback(async (phone: string) => {
    if (!phone) return;
    setLoadingChat(true);
    try {
      const [res, convo] = await Promise.all([API.messages.byPhone(phone), API.conversations.get(phone)]);
      setMessages(res.messages || []);
      setContactDetail(convo?.contact || null);
      await API.conversations.read(phone);
    } catch {
      setError("Chat load failed");
    } finally {
      setLoadingChat(false);
    }
  }, [setError]);

  const refreshChatSilently = useCallback(async (phone: string) => {
    if (!phone) return;
    try {
      const res = await API.messages.byPhone(phone);
      setMessages(res.messages || []);
    } catch {
      // silent refresh
    }
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
        void refreshListSilently();
        if (urlPhone && (!eventPhone || eventPhone === String(urlPhone))) void refreshChatSilently(urlPhone);
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
