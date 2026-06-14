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
  type?: string | null;
  buttons?: Array<{ id: string; title: string }>;
  payload?: {
    template?: { name?: string };
    image?: { link: string };
    document?: { link: string; filename?: string };
    audio?: { id?: string; link?: string };
    video?: { id?: string; link?: string };
    type?: string;
    interactive?: {
      type?: string;
      body?: { text?: string };
      action?: {
        buttons?: Array<{
          type?: string;
          reply?: { id?: string; title?: string };
        }>;
      };
    };
  };
  error?: any;
  display?: any;
};
