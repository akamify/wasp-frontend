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

  useEffect(() => {
    void loadList();
  }, [loadList]);

  return {
    activeConversation,
    filter,
    loadingList,
    refreshListSilently,
    search,
    setFilter,
    setSearch,
    visibleConversations,
  };
}

