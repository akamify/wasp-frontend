import type { LucideIcon } from "lucide-react";

export type Campaign = {
  _id: string;
  name: string;
  status: string;
  templateId: string;
  templateName?: string;
  type?: string;
  totals?: { total?: number; queued?: number; sent?: number; failed?: number };
  createdAt?: string;
  updatedAt?: string;
  lastError?: { message?: any };
};

export type Metrics = {
  audienceTotal: number;
  counts: {
    queued: number;
    accepted: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    replied: number;
  };
  updatedAt?: string;
};

export type CampaignAnalytics = {
  metrics?: {
    sent?: number;
    delivered?: number;
    read?: number;
    failed?: number;
    clicked?: number;
    converted?: number;
    revenue?: number;
    spend?: number;
    ctr?: number;
    conversionRate?: number;
    roi?: number | null;
  };
};

export type CampaignMessageItem = {
  id: string;
  phone: string;
  name: string;
  status: string;
  createdAt: string;
  whatsappMessageId?: string | null;
  error?: any;
};

export type ReplyItem = { phone: string; name: string; text: string; createdAt: string };

export type TabId = "overview" | "sent" | "delivered" | "read" | "replied" | "failed";

export type TabMetaItem = {
  id: TabId;
  label: string;
  Icon: LucideIcon;
  count: number;
  tone: "neutral" | "good" | "bad";
};
