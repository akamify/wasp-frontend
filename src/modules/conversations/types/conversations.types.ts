export type Conversation = {
  _id?: string;
  phone: string;
  lastMessageAt?: string;
  lastInboundAt?: string | null;
  lastMessagePreview?: string;
  unreadCount?: number;
  contact?: { name?: string; company?: string } | null;
};

export type ChatMessage = {
  _id: string;
  phone?: string;
  direction: "outbound" | "inbound";
  status: string;
  whatsappMessageId?: string | null;
  createdAt: string;
  text?: string;
  payload?: {
    template?: { name?: string };
    image?: { link: string };
    document?: { link: string; filename?: string };
    audio?: { id?: string; link?: string };
    video?: { id?: string; link?: string };
  };
  error?: any;
  display?: any;
};
