import { useCallback, useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import type { Conversation } from "@modules/conversations/types/conversations.types";

type Filter = "all" | "unread" | "read";

export function useConversationsList(urlPhone: string, setError: (message: string) => void) {
  const [items, setItems] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

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
    try {
      const data = await API.conversations.list({ limit: 120, search: search || undefined });
      setItems(data.conversations || []);
    } catch {
      setError("List load failed");
    } finally {
      setLoadingList(false);
    }
  }, [search, setError]);

  const refreshListSilently = useCallback(async () => {
    try {
      const data = await API.conversations.list({ limit: 120, search: search || undefined });
      setItems(data.conversations || []);
    } catch {
      // silent refresh
    }
  }, [search]);

  const applyRealtimeConversation = useCallback((payload: Record<string, unknown>) => {
    const patch = ((payload.conversation as Conversation | undefined) || payload) as Conversation;
    const phone = String(patch.phone || payload.customerPhone || "").trim();
    if (!phone) return;
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
    visibleConversations,
  };
}
