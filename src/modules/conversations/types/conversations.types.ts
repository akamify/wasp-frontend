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
  replyToMessageId?: string | null;
  createdAt: string;
  text?: string;
  displayText?: string | null;
  previewText?: string | null;
  type?: string | null;
  buttons?: Array<{ id: string; title: string }>;
  buttonReply?: { id?: string | null; title?: string | null };
  listReply?: { id?: string | null; title?: string | null; description?: string | null };
  interactive?: any;
  payload?: {
    template?: { name?: string };
    image?: { link: string };
    document?: { link: string; filename?: string };
    audio?: { id?: string; link?: string };
    video?: { id?: string; link?: string };
    type?: string;
    interactive?: {
      type?: string;
      button_reply?: { id?: string; title?: string };
      list_reply?: { id?: string; title?: string; description?: string };
      body?: { text?: string };
      action?: {
        buttons?: Array<{
          type?: string;
          reply?: { id?: string; title?: string };
        }>;
        sections?: Array<{
          title?: string;
          rows?: Array<{ id?: string; title?: string; description?: string }>;
        }>;
      };
    };
  };
  error?: any;
  display?: any;
};
