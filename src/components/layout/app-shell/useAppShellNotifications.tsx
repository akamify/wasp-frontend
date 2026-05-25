import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, MessageCircle } from "lucide-react";
import { API } from "@api/api";
import { relativeTime } from "@components/layout/app-shell/utils";
import type { AppNotification } from "@components/layout/app-shell/types";

export function useAppShellNotifications(notifOpen: boolean) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [lastReadAt, setLastReadAt] = useState(0);
  const markAllRead = useCallback(() => setLastReadAt(Date.now()), []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [conversationsRes, logsRes, walletRes] = await Promise.allSettled([
          API.conversations.list({ limit: 25 }),
          API.messages.logs({ page: 1, limit: 25 }),
          API.wallet.get(),
        ]);
        if (!alive) return;
        const conversations = conversationsRes.status === "fulfilled" && Array.isArray(conversationsRes.value?.conversations) ? conversationsRes.value.conversations : [];
        const logs = logsRes.status === "fulfilled" && Array.isArray(logsRes.value?.items) ? logsRes.value.items : [];
        const wallet = walletRes.status === "fulfilled" ? walletRes.value?.wallet : null;
        const unreadCount = conversations.reduce((total: number, item: any) => total + Number(item?.unreadCount || 0), 0);
        const latestConversation = conversations[0] || null;
        const latestLog = logs[0] || null;
        const latestFailed = logs.find((item: any) => String(item?.status || "").toLowerCase() === "failed") || null;
        const nextNotifications: AppNotification[] = [];
        if (unreadCount > 0) {
          const phone = latestConversation?.phone ? String(latestConversation.phone) : "";
          const eventTime = latestConversation?.lastMessageAt ? new Date(latestConversation.lastMessageAt).getTime() : Date.now();
          nextNotifications.push({ id: 1, title: "Inbox Activity", desc: `${unreadCount} unread message${unreadCount > 1 ? "s" : ""} in conversations.`, time: latestConversation?.lastMessageAt ? relativeTime(latestConversation.lastMessageAt) : "just now", icon: <MessageCircle size={16} />, color: "text-brand-600", bg: "bg-brand-50", link: phone ? `/app/conversations/${phone}` : "/app/conversations", _eventTime: eventTime });
        }
        if (latestConversation) {
          const contactName = latestConversation?.contact?.name || latestConversation?.phone || "contact";
          const phone = latestConversation?.phone ? String(latestConversation.phone) : "";
          const eventTime = latestConversation?.lastMessageAt ? new Date(latestConversation.lastMessageAt).getTime() : Date.now();
          nextNotifications.push({ id: 2, title: "Latest Conversation", desc: `Recent chat update from ${contactName}.`, time: latestConversation?.lastMessageAt ? relativeTime(latestConversation.lastMessageAt) : "just now", icon: <CheckCircle2 size={16} />, color: "text-emerald-500", bg: "bg-emerald-50", link: phone ? `/app/conversations/${phone}` : "/app/conversations", _eventTime: eventTime });
        }
        if (latestLog) {
          const status = String(latestLog?.status || "sent").toLowerCase();
          const phone = latestLog?.phone || latestLog?.to || "recipient";
          const eventTime = latestLog?.createdAt ? new Date(latestLog.createdAt).getTime() : Date.now();
          nextNotifications.push({ id: 5, title: status === "failed" ? "Latest Delivery Failed" : "Latest Message Update", desc: `Message to ${phone} is ${status}.`, time: latestLog?.createdAt ? relativeTime(latestLog.createdAt) : "just now", icon: status === "failed" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />, color: status === "failed" ? "text-rose-500" : "text-blue-500", bg: status === "failed" ? "bg-rose-50" : "bg-blue-50", link: `/app/activity?status=${encodeURIComponent(status)}&search=${encodeURIComponent(phone)}`, _eventTime: eventTime });
        }
        if (latestFailed) {
          const eventTime = latestFailed?.createdAt ? new Date(latestFailed.createdAt).getTime() : Date.now();
          nextNotifications.push({ id: 3, title: "Delivery Issue", desc: `A message to ${latestFailed?.phone || latestFailed?.to || "recipient"} failed.`, time: latestFailed?.createdAt ? relativeTime(latestFailed.createdAt) : "just now", icon: <AlertCircle size={16} />, color: "text-rose-500", bg: "bg-rose-50", link: `/app/activity?status=failed&search=${encodeURIComponent(latestFailed?.phone || latestFailed?.to || "")}`, _eventTime: eventTime });
        }
        if ((wallet?.balance ?? 0) < 100) {
          nextNotifications.push({ id: 4, title: "Wallet Low", desc: "Your balance is below Rs.100. Recharge now to avoid interruption.", time: "now", icon: <AlertCircle size={16} />, color: "text-amber-500", bg: "bg-amber-50", link: "/app/wallet", _eventTime: Date.now() });
        }
        setNotifications(nextNotifications.slice(0, 4));
      } catch {
        if (alive) setNotifications([]);
      }
    };

    const tick = () => {
      if (!document.hidden) void load();
    };
    tick();
    const timer = window.setInterval(tick, notifOpen ? 15000 : 60000);
    const onVisibility = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [notifOpen]);

  return { notifications, lastReadAt, markAllRead };
}

