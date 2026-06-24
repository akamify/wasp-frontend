import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API } from "@api/api";
import type { Conversation } from "@modules/conversations/types/conversations.types";

type Filter = "all" | "unread" | "read";

export function useConversationsList(urlPhone: string, setError: (message: string) => void) {
  const [items, setItems] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [totalUnread, setTotalUnread] = useState(0);
  const realtimePatchedAtRef = useRef(new Map<string, number>());
  const lastUnreadRealtimeAtRef = useRef(0);

  const applyFetchedItems = useCallback((incoming: Conversation[], requestStartedAt: number) => {
    setItems((current) => {
      const currentByPhone = new Map(current.map((item) => [item.phone, item]));
      const next: Conversation[] = (incoming || []).map((item) => {
        const normalized: Conversation = { ...item, unreadCount: Number(item.unreadCount || 0) };
        const existing = currentByPhone.get(item.phone);
        if (!existing || Number(realtimePatchedAtRef.current.get(item.phone) || 0) <= requestStartedAt) return normalized;
        currentByPhone.delete(item.phone);
        return {
          ...normalized,
          unreadCount: Number(existing.unreadCount || 0),
          lastMessage: existing.lastMessage,
          lastMessagePreview: existing.lastMessagePreview,
          lastMessageAt: existing.lastMessageAt,
          lastMessageDirection: existing.lastMessageDirection,
          lastMessageStatus: existing.lastMessageStatus,
        };
      });
      for (const existing of currentByPhone.values()) {
        if (Number(realtimePatchedAtRef.current.get(existing.phone) || 0) > requestStartedAt) next.push(existing);
      }
      return next.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
    });
  }, []);

  const activeConversation = useMemo(() => items.find((item) => item.phone === urlPhone) || null, [items, urlPhone]);

  const visibleConversations = useMemo(() => {
    return items.filter((item) => {
      if (filter === "unread") return Number(item.unreadCount || 0) > 0;
      if (filter === "read") return Number(item.unreadCount || 0) === 0;
      return true;
    });
  }, [items, filter]);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    const requestStartedAt = Date.now();
    try {
      const data = await API.conversations.list({ limit: 120, search: search || undefined });
      applyFetchedItems(data.conversations || [], requestStartedAt);
      if (lastUnreadRealtimeAtRef.current <= requestStartedAt) setTotalUnread(Number(data.totalUnread || 0));
    } catch {
      setError("List load failed");
    } finally {
      setLoadingList(false);
    }
  }, [search, setError, applyFetchedItems]);

  const refreshListSilently = useCallback(async () => {
    const requestStartedAt = Date.now();
    try {
      const data = await API.conversations.list({ limit: 120, search: search || undefined });
      applyFetchedItems(data.conversations || [], requestStartedAt);
      if (lastUnreadRealtimeAtRef.current <= requestStartedAt) setTotalUnread(Number(data.totalUnread || 0));
    } catch {
      // silent refresh
    }
  }, [search, applyFetchedItems]);

  const applyRealtimeConversation = useCallback((payload: Record<string, unknown>) => {
    const patch = ((payload.conversation as Conversation | undefined) || payload) as Conversation;
    const phone = String(patch.phone || payload.customerPhone || "").trim();
    if (!phone) return;
    realtimePatchedAtRef.current.set(phone, Date.now());
    setItems((current) => {
      const index = current.findIndex((item) => item.phone === phone || (patch._id && item._id === patch._id));
      const next = [...current];
      if (index >= 0) next[index] = { ...next[index], ...patch, phone };
      else next.push({ ...patch, phone });
      return next.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
    });
  }, []);

  const applyRealtimeUnread = useCallback((payload: Record<string, unknown>) => {
    const phone = String(payload.customerPhone || "").trim();
    const conversationId = String(payload.conversationId || "").trim();
    if (phone) realtimePatchedAtRef.current.set(phone, Date.now());
    if (payload.totalUnread !== undefined) {
      lastUnreadRealtimeAtRef.current = Date.now();
      setTotalUnread(Number(payload.totalUnread || 0));
    }
    console.info("[conversation-list] unread patched", { phone, unreadCount: Number(payload.unreadCount || 0) });
    setItems((current) => current.map((item) =>
      (phone && item.phone === phone) || (conversationId && item._id === conversationId)
        ? { ...item, unreadCount: Number(payload.unreadCount || 0) }
        : item
    ));
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  return {
    activeConversation,
    applyRealtimeConversation,
    applyRealtimeUnread,
    filter,
    loadingList,
    refreshListSilently,
    search,
    setFilter,
    setSearch,
    totalUnread,
    visibleConversations,
  };
}
